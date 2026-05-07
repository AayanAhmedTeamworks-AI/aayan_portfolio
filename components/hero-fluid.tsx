"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

/**
 * HeroFluid — single WebGL2 canvas that renders the entire hero state
 * AND its dissolve transition. Same DOM node, same context, no second
 * bust appearing in a new section ever.
 *
 * What it does, all in one render loop:
 *   - Stam stable-fluids simulation (advection, vorticity, projection)
 *     producing the golden-ink ambient backdrop
 *   - Periodic glyph injections (Devanagari ॐ, Arabic ع) into the dye
 *     field — the alchemical letter-burning beat
 *   - Bust photo composited on top at the right-column position with
 *     soft elliptical vignette
 *   - When dissolveProgress > 0: per-pixel domain-warped FBM dissolve
 *     front sweeps top-to-bottom across the bust. Pixels at the front
 *     additively bleed golden-sepia ink into the dye + inject downward
 *     drip + outward radial velocity. Bust is hidden where dissolved.
 *     Gaussian rim glow rides the front for the burning-paper edge.
 *
 * Render order each frame: glyph inject → dissolve dye inject →
 * dissolve velocity inject → fluid step → composite display. Injects
 * before step so the new ink/velocity get advected by this frame's
 * currents.
 */

const SIM_RES = 128;
const DYE_RES = 512;
const DENSITY_DISSIPATION = 0.94;
const VELOCITY_DISSIPATION = 0.22;
const PRESSURE_DISSIPATION = 0.82;
const PRESSURE_ITERATIONS = 18;
const CURL = 26;
const SPLAT_RADIUS = 0.22;
const SPLAT_FORCE_CURSOR = 1400;
const AUTO_SPLAT_INTERVAL_MS = 3800;
const GLYPH_INTERVAL_MS = 9000;
const GLYPH_FIRST_DELAY_MS = 3200;
const GLYPHS = ["ॐ", "ع"];

// Ambient ink (auto-splats + glyphs)
const AMBIENT_INK: [number, number, number] = [0.20, 0.16, 0.11];
// Dissolve front ink — slightly hotter than ambient so dissolved bust
// pixels read as fresh ink against the existing field.
const DISSOLVE_INK: [number, number, number] = [0.32, 0.26, 0.17];

// Bust framed in viewport UV — measured from Frontispiece's CSS bust
// at 1440-wide viewport (md:col-span-5, justify-end, max-w-md=448px,
// aspect-[3/4], items-center, max-w-[90rem] grid). Bust goes from
// UV (0.644, 0.169) to (0.956, 0.832).
const HERO_BUST_OFFSET: [number, number] = [0.644, 0.169];
const HERO_BUST_SIZE: [number, number] = [0.312, 0.663];
const BUST_CENTRE: [number, number] = [
  HERO_BUST_OFFSET[0] + HERO_BUST_SIZE[0] * 0.5,
  HERO_BUST_OFFSET[1] + HERO_BUST_SIZE[1] * 0.55,
];

// Dissolve params
const DISSOLVE_BAND = 0.06;
const DISSOLVE_ROLLOFF = 0.04;
const NOISE_SCALE = 5.0;
const WARP = 0.32;
const BIAS = 0; // 0=top-down, 1=bottom-up, 2=radial-out, 3=radial-in
const BIAS_AMT = 0.6;
const INK_GAIN = 1.0;
const DRIP_STRENGTH = 540;
const DISPERSE_STRENGTH = 130;
const VEL_JITTER = 0.25;
const RIM_INTENSITY = 0.36;

const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 a_position;
out vec2 v_uv;
out vec2 v_l;
out vec2 v_r;
out vec2 v_t;
out vec2 v_b;
uniform vec2 u_texelSize;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  v_l = v_uv - vec2(u_texelSize.x, 0.0);
  v_r = v_uv + vec2(u_texelSize.x, 0.0);
  v_t = v_uv + vec2(0.0, u_texelSize.y);
  v_b = v_uv - vec2(0.0, u_texelSize.y);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const SPLAT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_target;
uniform float u_aspectRatio;
uniform vec3 u_color;
uniform vec2 u_point;
uniform float u_radius;
out vec4 fragColor;
void main() {
  vec2 p = v_uv - u_point;
  p.x *= u_aspectRatio;
  vec3 splat = exp(-dot(p, p) / u_radius) * u_color;
  vec3 base = texture(u_target, v_uv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`;

const ADVECTION = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform sampler2D u_source;
uniform vec2 u_texelSize;
uniform float u_dt;
uniform float u_dissipation;
out vec4 fragColor;
void main() {
  vec2 coord = v_uv - u_dt * texture(u_velocity, v_uv).xy * u_texelSize;
  vec4 result = texture(u_source, coord);
  float decay = 1.0 + u_dissipation * u_dt;
  fragColor = result / decay;
}`;

const DIVERGENCE = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_l;
in vec2 v_r;
in vec2 v_t;
in vec2 v_b;
uniform sampler2D u_velocity;
out vec4 fragColor;
void main() {
  float L = texture(u_velocity, v_l).x;
  float R = texture(u_velocity, v_r).x;
  float T = texture(u_velocity, v_t).y;
  float B = texture(u_velocity, v_b).y;
  vec2 C = texture(u_velocity, v_uv).xy;
  if (v_l.x < 0.0) { L = -C.x; }
  if (v_r.x > 1.0) { R = -C.x; }
  if (v_t.y > 1.0) { T = -C.y; }
  if (v_b.y < 0.0) { B = -C.y; }
  float div = 0.5 * (R - L + T - B);
  fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const PRESSURE = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_l;
in vec2 v_r;
in vec2 v_t;
in vec2 v_b;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
out vec4 fragColor;
void main() {
  float L = texture(u_pressure, v_l).x;
  float R = texture(u_pressure, v_r).x;
  float T = texture(u_pressure, v_t).x;
  float B = texture(u_pressure, v_b).x;
  float divergence = texture(u_divergence, v_uv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const GRAD_SUBTRACT = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_l;
in vec2 v_r;
in vec2 v_t;
in vec2 v_b;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
out vec4 fragColor;
void main() {
  float L = texture(u_pressure, v_l).x;
  float R = texture(u_pressure, v_r).x;
  float T = texture(u_pressure, v_t).x;
  float B = texture(u_pressure, v_b).x;
  vec2 velocity = texture(u_velocity, v_uv).xy;
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const CURL_FS = `#version 300 es
precision highp float;
in vec2 v_l;
in vec2 v_r;
in vec2 v_t;
in vec2 v_b;
uniform sampler2D u_velocity;
out vec4 fragColor;
void main() {
  float L = texture(u_velocity, v_l).y;
  float R = texture(u_velocity, v_r).y;
  float T = texture(u_velocity, v_t).x;
  float B = texture(u_velocity, v_b).x;
  float curl = R - L - T + B;
  fragColor = vec4(0.5 * curl, 0.0, 0.0, 1.0);
}`;

const VORTICITY = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_l;
in vec2 v_r;
in vec2 v_t;
in vec2 v_b;
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform float u_curlStrength;
uniform float u_dt;
out vec4 fragColor;
void main() {
  float L = texture(u_curl, v_l).x;
  float R = texture(u_curl, v_r).x;
  float T = texture(u_curl, v_t).x;
  float B = texture(u_curl, v_b).x;
  float C = texture(u_curl, v_uv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= u_curlStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture(u_velocity, v_uv).xy;
  velocity += force * u_dt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const CLEAR = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_source;
uniform float u_value;
out vec4 fragColor;
void main() {
  fragColor = u_value * texture(u_source, v_uv);
}`;

const GLYPH_INJECT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_target;
uniform sampler2D u_glyph;
uniform vec2 u_center;
uniform vec2 u_scale;
uniform vec3 u_color;
out vec4 fragColor;
void main() {
  vec2 p = (v_uv - u_center) / u_scale + 0.5;
  vec3 base = texture(u_target, v_uv).xyz;
  vec3 add = vec3(0.0);
  if (p.x >= 0.0 && p.x <= 1.0 && p.y >= 0.0 && p.y <= 1.0) {
    float a = texture(u_glyph, p).a;
    add = u_color * a;
  }
  fragColor = vec4(base + add, 1.0);
}`;

// Shared dissolve helpers — domain-warped FBM threshold
const DISSOLVE_HEADER = `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}
float dissolveThreshold(vec2 uv, int bias, float biasAmt, float noiseScale, float warp) {
  vec2 q = vec2(fbm(uv * noiseScale + 1.7),
                fbm(uv * noiseScale + 9.2));
  float n = fbm(uv * noiseScale + warp * q);
  float dir;
  if      (bias == 0) dir = 1.0 - uv.y;
  else if (bias == 1) dir = uv.y;
  else if (bias == 2) dir = length(uv - 0.5) * 1.4142;
  else                dir = 1.0 - length(uv - 0.5) * 1.4142;
  return mix(n, dir, biasAmt);
}
`;

const DISSOLVE_DYE_INJECT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_dye;
uniform sampler2D u_bust;
uniform float u_progress;
uniform float u_band;
uniform float u_inkGain;
uniform vec3 u_inkColor;
uniform vec2 u_heroOffset;
uniform vec2 u_heroSize;
uniform int u_bias;
uniform float u_biasAmt;
uniform float u_noiseScale;
uniform float u_warp;
uniform float u_dt;
out vec4 fragColor;
${DISSOLVE_HEADER}
void main() {
  vec3 prev = texture(u_dye, v_uv).rgb;
  vec2 bUV = (v_uv - u_heroOffset) / u_heroSize;
  if (bUV.x < 0.0 || bUV.x > 1.0 || bUV.y < 0.0 || bUV.y > 1.0) {
    fragColor = vec4(prev, 1.0);
    return;
  }
  vec4 bust = texture(u_bust, bUV);
  if (bust.a < 0.05) {
    fragColor = vec4(prev, 1.0);
    return;
  }
  float thr = dissolveThreshold(bUV, u_bias, u_biasAmt, u_noiseScale, u_warp);
  float front = smoothstep(u_progress - u_band, u_progress, thr)
              * (1.0 - smoothstep(u_progress, u_progress + u_band, thr));
  float lum = dot(bust.rgb, vec3(0.299, 0.587, 0.114));
  vec3 deposit = u_inkColor * mix(0.5, 1.4, lum) * bust.a * u_inkGain;
  fragColor = vec4(prev + deposit * front * u_dt * 60.0, 1.0);
}`;

const DISSOLVE_VEL_INJECT = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_velocity;
uniform sampler2D u_bust;
uniform float u_progress;
uniform float u_band;
uniform float u_dripStrength;
uniform float u_disperseStrength;
uniform float u_jitter;
uniform vec2 u_heroOffset;
uniform vec2 u_heroSize;
uniform vec2 u_bustCentre;
uniform int u_bias;
uniform float u_biasAmt;
uniform float u_noiseScale;
uniform float u_warp;
uniform float u_dt;
uniform float u_time;
out vec4 fragColor;
${DISSOLVE_HEADER}
void main() {
  vec2 prev = texture(u_velocity, v_uv).xy;
  vec2 bUV = (v_uv - u_heroOffset) / u_heroSize;
  if (bUV.x < 0.0 || bUV.x > 1.0 || bUV.y < 0.0 || bUV.y > 1.0) {
    fragColor = vec4(prev, 0.0, 1.0);
    return;
  }
  float a = texture(u_bust, bUV).a;
  if (a < 0.05) {
    fragColor = vec4(prev, 0.0, 1.0);
    return;
  }
  float thr = dissolveThreshold(bUV, u_bias, u_biasAmt, u_noiseScale, u_warp);
  float front = smoothstep(u_progress - u_band, u_progress, thr)
              * (1.0 - smoothstep(u_progress, u_progress + u_band, thr));
  vec2 drip = vec2(0.0, -u_dripStrength);
  vec2 radial = normalize(v_uv - u_bustCentre + 1e-4) * u_disperseStrength;
  float n1 = fbm(v_uv * 6.0 + u_time * 0.3);
  float n2 = fbm(v_uv * 6.0 + 17.0 - u_time * 0.3);
  vec2 turb = (vec2(n1, n2) - 0.5) * 2.0 * u_jitter * u_dripStrength;
  vec2 add = (drip + radial + turb) * front * a * u_dt;
  fragColor = vec4(prev + add, 0.0, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_dye;
uniform sampler2D u_bust;
uniform vec3 u_canvasColor;
uniform vec3 u_rimColor;
uniform float u_rimIntensity;
uniform float u_progress;
uniform float u_rolloff;
uniform vec2 u_heroOffset;
uniform vec2 u_heroSize;
uniform vec2 u_bustTilt;
uniform int u_bias;
uniform float u_biasAmt;
uniform float u_noiseScale;
uniform float u_warp;
out vec4 fragColor;
${DISSOLVE_HEADER}
void main() {
  vec3 dye = texture(u_dye, v_uv).rgb;
  vec3 fluid = u_canvasColor + dye;

  vec2 bUV = (v_uv - u_heroOffset) / u_heroSize
           + u_bustTilt * (1.0 - u_progress);
  bool inside = bUV.x >= 0.0 && bUV.x <= 1.0 && bUV.y >= 0.0 && bUV.y <= 1.0;
  if (!inside) {
    fragColor = vec4(fluid, 1.0);
    return;
  }
  vec4 bust = texture(u_bust, bUV);
  // The bust photo has an opaque dark background — without dropping it
  // we see a hard dark rectangle around the marble (the user's "looks
  // like a 2D image" complaint). Extract alpha from luminance so the
  // dark background becomes effectively transparent and the bust reads
  // as carved out of the canvas, not pasted on top.
  float lum = max(max(bust.r, bust.g), bust.b);
  float silhouette = smoothstep(0.04, 0.18, lum);
  float bustAlpha = bust.a * silhouette;
  // Subtle warm halo behind the bust silhouette — anchors the figure
  // in the canvas instead of having it float as a flat cutout.
  vec3 halo = vec3(0.07, 0.05, 0.03) * silhouette;
  vec3 bg = fluid + halo;

  float thr = dissolveThreshold(bUV, u_bias, u_biasAmt, u_noiseScale, u_warp);
  float visible = 1.0 - smoothstep(u_progress - u_rolloff,
                                   u_progress + u_rolloff, thr);
  float gaussian = exp(-pow((thr - u_progress) / u_rolloff, 2.0) * 3.0);
  vec3 rim = u_rimColor * gaussian * u_rimIntensity * bustAlpha;
  vec3 col = mix(bg, bust.rgb, visible * bustAlpha) + rim;
  fragColor = vec4(col, 1.0);
}`;

type Program = {
  prog: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
};

type FBO = {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};

type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  label: string,
): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    console.error(`[HeroFluid] shader compile (${label}):`, log);
    gl.deleteShader(shader);
    throw new Error(`Shader compile (${label}): ` + log);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  fragSource: string,
  label: string,
): Program {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX, `${label}.vs`);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource, `${label}.fs`);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    console.error(`[HeroFluid] program link (${label}):`, log);
    throw new Error(`Program link (${label}): ` + log);
  }
  const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(prog, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name);
  }
  return { prog, uniforms };
}

function createFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): FBO {
  gl.activeTexture(gl.TEXTURE0);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    tex,
    0,
  );
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);
  return {
    tex,
    fbo,
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    attach(id: number) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      return id;
    },
  };
}

function createDoubleFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number,
): DoubleFBO {
  let read = createFBO(gl, w, h, internalFormat, format, type, filter);
  let write = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    width: w,
    height: h,
    texelSizeX: 1 / w,
    texelSizeY: 1 / h,
    get read() {
      return read;
    },
    set read(v) {
      read = v;
    },
    get write() {
      return write;
    },
    set write(v) {
      write = v;
    },
    swap() {
      const t = read;
      read = write;
      write = t;
    },
  };
}

function loadImageTexture(
  gl: WebGL2RenderingContext,
  url: string,
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        img,
      );
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      resolve(tex);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

class HeroFluidSim {
  private gl: WebGL2RenderingContext;
  private programs!: {
    splat: Program;
    advection: Program;
    divergence: Program;
    pressure: Program;
    gradSubtract: Program;
    curl: Program;
    vorticity: Program;
    clear: Program;
    glyphInject: Program;
    dissolveDye: Program;
    dissolveVel: Program;
    composite: Program;
  };
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private vao!: WebGLVertexArrayObject;
  private bustTex: WebGLTexture | null = null;
  private glyphTextures: WebGLTexture[] = [];
  private rafId = 0;
  private lastTime = 0;
  private lastAutoSplat = 0;
  private lastGlyphInject = 0;
  private startedAt = 0;
  public dissolveProgress = 0;
  public bustTiltX = 0;
  public bustTiltY = 0;
  private cursor = { x: -1, y: -1, dx: 0, dy: 0, moved: false, inside: false };
  private paused = false;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private internalFormat: number;
  private internalFormatRG: number;
  private internalFormatR: number;
  private floatType: number;
  private cleanups: Array<() => void> = [];

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("OES_texture_half_float_linear");

    this.internalFormat = gl.RGBA16F;
    this.internalFormatRG = gl.RG16F;
    this.internalFormatR = gl.R16F;
    this.floatType = gl.HALF_FLOAT;

    this.initVAO();
    this.initPrograms();
    this.resize();
    this.initFBOs();
    this.initGlyphs();
    this.bindEvents();
    this.lastTime = performance.now();
    this.lastAutoSplat = this.lastTime;
    this.startedAt = this.lastTime;
    this.lastGlyphInject =
      this.lastTime - GLYPH_INTERVAL_MS + GLYPH_FIRST_DELAY_MS;

    loadImageTexture(gl, "/bust.png")
      .then((tex) => {
        this.bustTex = tex;
      })
      .catch((e) => console.error("[HeroFluid] bust load:", e));

    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);

    setTimeout(() => this.autoSplat(0.32, 0.55), 60);
    setTimeout(() => this.autoSplat(0.68, 0.42), 240);
  }

  private initVAO() {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    this.vao = vao;
  }

  private initPrograms() {
    const gl = this.gl;
    this.programs = {
      splat: createProgram(gl, SPLAT, "splat"),
      advection: createProgram(gl, ADVECTION, "advection"),
      divergence: createProgram(gl, DIVERGENCE, "divergence"),
      pressure: createProgram(gl, PRESSURE, "pressure"),
      gradSubtract: createProgram(gl, GRAD_SUBTRACT, "gradSubtract"),
      curl: createProgram(gl, CURL_FS, "curl"),
      vorticity: createProgram(gl, VORTICITY, "vorticity"),
      clear: createProgram(gl, CLEAR, "clear"),
      glyphInject: createProgram(gl, GLYPH_INJECT, "glyphInject"),
      dissolveDye: createProgram(gl, DISSOLVE_DYE_INJECT, "dissolveDye"),
      dissolveVel: createProgram(gl, DISSOLVE_VEL_INJECT, "dissolveVel"),
      composite: createProgram(gl, COMPOSITE, "composite"),
    };
  }

  private initFBOs() {
    const gl = this.gl;
    const dyeRes = this.getResolution(DYE_RES);
    const simRes = this.getResolution(SIM_RES);
    this.dye = createDoubleFBO(
      gl,
      dyeRes.w,
      dyeRes.h,
      this.internalFormat,
      gl.RGBA,
      this.floatType,
      gl.LINEAR,
    );
    this.velocity = createDoubleFBO(
      gl,
      simRes.w,
      simRes.h,
      this.internalFormatRG,
      gl.RG,
      this.floatType,
      gl.LINEAR,
    );
    this.pressure = createDoubleFBO(
      gl,
      simRes.w,
      simRes.h,
      this.internalFormatR,
      gl.RED,
      this.floatType,
      gl.NEAREST,
    );
    this.divergence = createFBO(
      gl,
      simRes.w,
      simRes.h,
      this.internalFormatR,
      gl.RED,
      this.floatType,
      gl.NEAREST,
    );
    this.curl = createFBO(
      gl,
      simRes.w,
      simRes.h,
      this.internalFormatR,
      gl.RED,
      this.floatType,
      gl.NEAREST,
    );
  }

  private initGlyphs() {
    if (typeof document === "undefined") return;
    for (const g of GLYPHS) {
      const tex = this.createGlyphTexture(g);
      if (tex) this.glyphTextures.push(tex);
    }
  }

  private createGlyphTexture(glyph: string): WebGLTexture | null {
    const gl = this.gl;
    const size = 384;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.round(size * 0.72)}px "Times New Roman", "Noto Naskh Arabic", "Noto Sans Devanagari", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, size / 2, size / 2);

    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      c,
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }

  private getResolution(target: number) {
    const ratio = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    if (ratio < 1) return { w: target, h: Math.round(target / ratio) };
    return { w: Math.round(target * ratio), h: target };
  }

  private bindEvents() {
    const c = this.canvas;
    const onMove = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      this.cursor.dx = (x - this.cursor.x) * 5;
      this.cursor.dy = (y - this.cursor.y) * 5;
      this.cursor.x = x;
      this.cursor.y = y;
      this.cursor.moved = true;
      this.cursor.inside = true;
    };
    const onLeave = () => {
      this.cursor.inside = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerout", onLeave);
    this.cleanups.push(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    });
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(c);
    this.resizeObserver = ro;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) this.paused = !e.isIntersecting;
      },
      { threshold: 0.01 },
    );
    io.observe(c);
    this.intersectionObserver = io;
  }

  private resize() {
    const c = this.canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.floor(c.clientWidth * dpr);
    const h = Math.floor(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
  }

  private blit(target: FBO | null) {
    const gl = this.gl;
    if (target === null) {
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private splatVelocity(
    x: number,
    y: number,
    dx: number,
    dy: number,
    rs = 1,
  ) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const radius = (SPLAT_RADIUS / 100) * rs;
    const p = this.programs.splat;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_target"]!, this.velocity.read.attach(0));
    gl.uniform1f(p.uniforms["u_aspectRatio"]!, aspect);
    gl.uniform2f(p.uniforms["u_point"]!, x, y);
    gl.uniform3f(p.uniforms["u_color"]!, dx, dy, 0);
    gl.uniform1f(p.uniforms["u_radius"]!, radius);
    this.blit(this.velocity.write);
    this.velocity.swap();
  }

  private splatDye(
    x: number,
    y: number,
    color: [number, number, number],
    rs = 1,
  ) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const radius = (SPLAT_RADIUS / 100) * rs;
    const p = this.programs.splat;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_target"]!, this.dye.read.attach(0));
    gl.uniform1f(p.uniforms["u_aspectRatio"]!, aspect);
    gl.uniform2f(p.uniforms["u_point"]!, x, y);
    gl.uniform3f(p.uniforms["u_color"]!, color[0], color[1], color[2]);
    gl.uniform1f(p.uniforms["u_radius"]!, radius);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private autoSplat(x?: number, y?: number) {
    // Bias auto-splats to the LEFT half so they don't constantly mess with
    // the bust frame on the right (let dissolve be the dominant motion there).
    const px = x ?? 0.1 + Math.random() * 0.45;
    const py = y ?? 0.25 + Math.random() * 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1100 * (0.6 + Math.random() * 0.6);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const variance = 0.85 + Math.random() * 0.3;
    const color: [number, number, number] = [
      AMBIENT_INK[0] * variance,
      AMBIENT_INK[1] * variance,
      AMBIENT_INK[2] * variance,
    ];
    this.splatVelocity(px, py, dx, dy);
    this.splatDye(px, py, color);
  }

  private cursorSplat() {
    if (!this.cursor.moved || !this.cursor.inside) return;
    const dx = this.cursor.dx * SPLAT_FORCE_CURSOR;
    const dy = this.cursor.dy * SPLAT_FORCE_CURSOR;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      this.cursor.moved = false;
      return;
    }
    this.splatVelocity(this.cursor.x, this.cursor.y, dx, dy);

    // If cursor is over the bust, also paint ink — the user can wound /
    // destroy the bust with the cursor. Dye intensity scales with cursor
    // speed so a flick draws a heavier streak than a hover.
    const bx = (this.cursor.x - HERO_BUST_OFFSET[0]) / HERO_BUST_SIZE[0];
    const by = (this.cursor.y - HERO_BUST_OFFSET[1]) / HERO_BUST_SIZE[1];
    if (bx >= 0 && bx <= 1 && by >= 0 && by <= 1) {
      const speed = Math.sqrt(
        this.cursor.dx * this.cursor.dx + this.cursor.dy * this.cursor.dy,
      );
      const intensity = Math.min(1.5, speed * 4);
      const color: [number, number, number] = [
        DISSOLVE_INK[0] * intensity,
        DISSOLVE_INK[1] * intensity,
        DISSOLVE_INK[2] * intensity,
      ];
      this.splatDye(this.cursor.x, this.cursor.y, color, 0.45);
    }
    this.cursor.moved = false;
  }

  private injectGlyph() {
    const gl = this.gl;
    if (this.glyphTextures.length === 0) return;
    const aspect = this.canvas.width / this.canvas.height;
    const idx = Math.floor(Math.random() * this.glyphTextures.length);
    const tex = this.glyphTextures[idx];
    // Keep glyphs OUT of the bust area so they don't fight the dissolve
    const zone = Math.random();
    let cx: number;
    let cy: number;
    if (zone < 0.5) {
      // Left third
      cx = 0.08 + Math.random() * 0.3;
      cy = 0.2 + Math.random() * 0.6;
    } else if (zone < 0.75) {
      // Above bust
      cx = 0.45 + Math.random() * 0.4;
      cy = 0.84 + Math.random() * 0.1;
    } else {
      // Below bust
      cx = 0.45 + Math.random() * 0.4;
      cy = 0.06 + Math.random() * 0.1;
    }
    const sy = 0.16 + Math.random() * 0.06;
    const sx = sy / aspect;
    const intensity = 0.85;
    const color: [number, number, number] = [
      Math.min(1.6, AMBIENT_INK[0] * intensity * 4.0),
      Math.min(1.6, AMBIENT_INK[1] * intensity * 4.0),
      Math.min(1.6, AMBIENT_INK[2] * intensity * 4.0),
    ];
    const p = this.programs.glyphInject;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_target"]!, this.dye.read.attach(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.uniforms["u_glyph"]!, 1);
    gl.uniform2f(p.uniforms["u_center"]!, cx, cy);
    gl.uniform2f(p.uniforms["u_scale"]!, sx, sy);
    gl.uniform3f(p.uniforms["u_color"]!, color[0], color[1], color[2]);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private injectDissolveDye(dt: number) {
    if (!this.bustTex || this.dissolveProgress <= 0) return;
    const gl = this.gl;
    gl.disable(gl.BLEND);
    const p = this.programs.dissolveDye;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_dye"]!, this.dye.read.attach(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bustTex);
    gl.uniform1i(p.uniforms["u_bust"]!, 1);
    gl.uniform1f(p.uniforms["u_progress"]!, this.dissolveProgress);
    gl.uniform1f(p.uniforms["u_band"]!, DISSOLVE_BAND);
    gl.uniform1f(p.uniforms["u_inkGain"]!, INK_GAIN);
    gl.uniform3f(
      p.uniforms["u_inkColor"]!,
      DISSOLVE_INK[0],
      DISSOLVE_INK[1],
      DISSOLVE_INK[2],
    );
    gl.uniform2f(
      p.uniforms["u_heroOffset"]!,
      HERO_BUST_OFFSET[0],
      HERO_BUST_OFFSET[1],
    );
    gl.uniform2f(
      p.uniforms["u_heroSize"]!,
      HERO_BUST_SIZE[0],
      HERO_BUST_SIZE[1],
    );
    gl.uniform1i(p.uniforms["u_bias"]!, BIAS);
    gl.uniform1f(p.uniforms["u_biasAmt"]!, BIAS_AMT);
    gl.uniform1f(p.uniforms["u_noiseScale"]!, NOISE_SCALE);
    gl.uniform1f(p.uniforms["u_warp"]!, WARP);
    gl.uniform1f(p.uniforms["u_dt"]!, dt);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private injectDissolveVelocity(dt: number) {
    if (!this.bustTex || this.dissolveProgress <= 0) return;
    const gl = this.gl;
    gl.disable(gl.BLEND);
    const p = this.programs.dissolveVel;
    const time = (performance.now() - this.startedAt) / 1000;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_velocity"]!, this.velocity.read.attach(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bustTex);
    gl.uniform1i(p.uniforms["u_bust"]!, 1);
    gl.uniform1f(p.uniforms["u_progress"]!, this.dissolveProgress);
    gl.uniform1f(p.uniforms["u_band"]!, DISSOLVE_BAND);
    gl.uniform1f(p.uniforms["u_dripStrength"]!, DRIP_STRENGTH);
    gl.uniform1f(p.uniforms["u_disperseStrength"]!, DISPERSE_STRENGTH);
    gl.uniform1f(p.uniforms["u_jitter"]!, VEL_JITTER);
    gl.uniform2f(
      p.uniforms["u_heroOffset"]!,
      HERO_BUST_OFFSET[0],
      HERO_BUST_OFFSET[1],
    );
    gl.uniform2f(
      p.uniforms["u_heroSize"]!,
      HERO_BUST_SIZE[0],
      HERO_BUST_SIZE[1],
    );
    gl.uniform2f(
      p.uniforms["u_bustCentre"]!,
      BUST_CENTRE[0],
      BUST_CENTRE[1],
    );
    gl.uniform1i(p.uniforms["u_bias"]!, BIAS);
    gl.uniform1f(p.uniforms["u_biasAmt"]!, BIAS_AMT);
    gl.uniform1f(p.uniforms["u_noiseScale"]!, NOISE_SCALE);
    gl.uniform1f(p.uniforms["u_warp"]!, WARP);
    gl.uniform1f(p.uniforms["u_dt"]!, dt);
    gl.uniform1f(p.uniforms["u_time"]!, time);
    this.blit(this.velocity.write);
    this.velocity.swap();
  }

  private step(dt: number) {
    const gl = this.gl;
    gl.disable(gl.BLEND);
    const u = (p: Program, k: string) => p.uniforms[k]!;
    {
      const p = this.programs.curl;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(0));
      this.blit(this.curl);
    }
    {
      const p = this.programs.vorticity;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(0));
      gl.uniform1i(u(p, "u_curl"), this.curl.attach(1));
      gl.uniform1f(u(p, "u_curlStrength"), CURL);
      gl.uniform1f(u(p, "u_dt"), dt);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }
    {
      const p = this.programs.divergence;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(0));
      this.blit(this.divergence);
    }
    {
      const p = this.programs.clear;
      gl.useProgram(p.prog);
      gl.uniform1i(u(p, "u_source"), this.pressure.read.attach(0));
      gl.uniform1f(u(p, "u_value"), PRESSURE_DISSIPATION);
      this.blit(this.pressure.write);
      this.pressure.swap();
    }
    {
      const p = this.programs.pressure;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_divergence"), this.divergence.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(u(p, "u_pressure"), this.pressure.read.attach(1));
        this.blit(this.pressure.write);
        this.pressure.swap();
      }
    }
    {
      const p = this.programs.gradSubtract;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_pressure"), this.pressure.read.attach(0));
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(1));
      this.blit(this.velocity.write);
      this.velocity.swap();
    }
    {
      const p = this.programs.advection;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(0));
      gl.uniform1i(u(p, "u_source"), this.velocity.read.attach(0));
      gl.uniform1f(u(p, "u_dt"), dt);
      gl.uniform1f(u(p, "u_dissipation"), VELOCITY_DISSIPATION);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }
    {
      const p = this.programs.advection;
      gl.useProgram(p.prog);
      gl.uniform2f(
        u(p, "u_texelSize"),
        this.dye.texelSizeX,
        this.dye.texelSizeY,
      );
      gl.uniform1i(u(p, "u_velocity"), this.velocity.read.attach(0));
      gl.uniform1i(u(p, "u_source"), this.dye.read.attach(1));
      gl.uniform1f(u(p, "u_dt"), dt);
      gl.uniform1f(u(p, "u_dissipation"), DENSITY_DISSIPATION);
      this.blit(this.dye.write);
      this.dye.swap();
    }
  }

  private render() {
    const gl = this.gl;
    if (!this.bustTex) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.078, 0.067, 0.051, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    const p = this.programs.composite;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_dye"]!, this.dye.read.attach(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bustTex);
    gl.uniform1i(p.uniforms["u_bust"]!, 1);
    gl.uniform3f(p.uniforms["u_canvasColor"]!, 0.078, 0.067, 0.051);
    gl.uniform3f(p.uniforms["u_rimColor"]!, 0.55, 0.42, 0.22);
    gl.uniform1f(p.uniforms["u_rimIntensity"]!, RIM_INTENSITY);
    gl.uniform1f(p.uniforms["u_progress"]!, this.dissolveProgress);
    gl.uniform1f(p.uniforms["u_rolloff"]!, DISSOLVE_ROLLOFF);
    gl.uniform2f(
      p.uniforms["u_heroOffset"]!,
      HERO_BUST_OFFSET[0],
      HERO_BUST_OFFSET[1],
    );
    gl.uniform2f(
      p.uniforms["u_heroSize"]!,
      HERO_BUST_SIZE[0],
      HERO_BUST_SIZE[1],
    );
    gl.uniform2f(p.uniforms["u_bustTilt"]!, this.bustTiltX, this.bustTiltY);
    gl.uniform1i(p.uniforms["u_bias"]!, BIAS);
    gl.uniform1f(p.uniforms["u_biasAmt"]!, BIAS_AMT);
    gl.uniform1f(p.uniforms["u_noiseScale"]!, NOISE_SCALE);
    gl.uniform1f(p.uniforms["u_warp"]!, WARP);
    this.blit(null);
  }

  private tick() {
    if (this.paused) {
      this.lastTime = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }
    const now = performance.now();
    const dtRaw = (now - this.lastTime) / 1000;
    const dt = Math.min(dtRaw, 1 / 60);
    this.lastTime = now;

    if (now - this.lastAutoSplat >= AUTO_SPLAT_INTERVAL_MS) {
      this.autoSplat();
      this.lastAutoSplat = now;
    }
    if (now - this.lastGlyphInject >= GLYPH_INTERVAL_MS) {
      this.injectGlyph();
      this.lastGlyphInject = now;
    }
    this.cursorSplat();

    // Inject BEFORE step so injected ink/velocity get advected this frame
    this.injectDissolveDye(dt);
    this.injectDissolveVelocity(dt);
    this.step(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  }

  dispose() {
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    for (const c of this.cleanups) c();
  }
}

export function HeroFluid({
  dissolveProgress,
  bustTiltX,
  bustTiltY,
}: {
  dissolveProgress?: MotionValue<number>;
  bustTiltX?: MotionValue<number>;
  bustTiltY?: MotionValue<number>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduce) return;
    }

    let sim: HeroFluidSim | null = null;
    try {
      sim = new HeroFluidSim(canvas);
    } catch (err) {
      console.warn("[HeroFluid] disabled:", err);
    }

    const unsubs: Array<() => void> = [];
    if (dissolveProgress) {
      const u = dissolveProgress.on("change", (v) => {
        if (sim) sim.dissolveProgress = Math.max(0, Math.min(1, v));
      });
      unsubs.push(u);
      if (sim)
        sim.dissolveProgress = Math.max(0, Math.min(1, dissolveProgress.get()));
    }
    if (bustTiltX) {
      const u = bustTiltX.on("change", (v) => {
        if (sim) sim.bustTiltX = v;
      });
      unsubs.push(u);
      if (sim) sim.bustTiltX = bustTiltX.get();
    }
    if (bustTiltY) {
      const u = bustTiltY.on("change", (v) => {
        if (sim) sim.bustTiltY = v;
      });
      unsubs.push(u);
      if (sim) sim.bustTiltY = bustTiltY.get();
    }

    return () => {
      for (const u of unsubs) u();
      sim?.dispose();
    };
  }, [dissolveProgress, bustTiltX, bustTiltY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
      style={{ background: "var(--color-canvas)" }}
    />
  );
}
