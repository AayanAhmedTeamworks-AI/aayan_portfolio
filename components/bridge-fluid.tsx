"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

/**
 * BridgeFluid — bust dissolves into ink (B2). Same Stam stable-fluids
 * substrate underneath; the new game is in three additional shaders:
 *
 *   1. DISSOLVE_DYE_INJECT — runs BEFORE the simulation step. For pixels
 *      at the dissolve front (a smoothstep band centred on the current
 *      progress, gated by per-pixel FBM threshold), additively deposit
 *      golden-sepia ink into the dye FBO. Highlight-weighted so the
 *      bust's bright planes bleed more ink than its shadows.
 *
 *   2. DISSOLVE_VEL_INJECT — runs BEFORE the simulation step. Same front
 *      band, but writes velocity: downward drip + outward radial
 *      disperse from the bust centre + curl-noise jitter so drips don't
 *      fall in lockstep. Projection inside step() then makes the
 *      injected motion incompressible — the difference between "ink"
 *      and "particles."
 *
 *   3. COMPOSITE — replaces old camera-dolly composite. Renders bust
 *      where it has not yet dissolved; renders fluid (canvas + dye)
 *      where it has. Adds a Gaussian-profile warm rim glow exactly at
 *      the dissolve front — burning-paper edge, the single biggest
 *      cinematic-vs-broken difference.
 *
 * The bust is framed at the hero's right-column position (matched to
 * Frontispiece's CSS bust frame) so the handoff from hero is seamless.
 *
 * Dissolve front uses domain-warped FBM with a directional bias (top-to-
 * bottom by default) — the warp is what kills grid-noise pixelation and
 * gives the ink-bleed look.
 */

const SIM_RES = 96;
const DYE_RES = 384;
const DENSITY_DISSIPATION = 0.94;
const VELOCITY_DISSIPATION = 0.22;
const PRESSURE_DISSIPATION = 0.82;
const PRESSURE_ITERATIONS = 16;
const CURL = 24;
const SPLAT_RADIUS = 0.22;
const AUTO_SPLAT_INTERVAL_MS = 4500;

// Ambient ink (auto-splats) — slightly cooler than the dissolve front so
// the dissolved bust ink reads as warmer / hotter / fresher.
const AMBIENT_INK: [number, number, number] = [0.20, 0.16, 0.11];
// Dissolve-front ink — golden sepia, warmer and brighter
const DISSOLVE_INK: [number, number, number] = [0.32, 0.26, 0.17];

// Bust framed in viewport UV at the hero's final state — matches
// Frontispiece's CSS bust position so the handoff is seamless.
// Computed from the actual hero CSS layout (md:col-span-5, justify-end,
// max-w-md = 448px, aspect-[3/4], items-center, max-w-[90rem] grid)
// at a 1440-wide viewport: UV-x 0.644-0.956, UV-y 0.169-0.832.
const HERO_BUST_OFFSET: [number, number] = [0.644, 0.169];
const HERO_BUST_SIZE: [number, number] = [0.312, 0.663];
// Bust centre in viewport UV (used by velocity injection for outward push)
const BUST_CENTRE: [number, number] = [
  HERO_BUST_OFFSET[0] + HERO_BUST_SIZE[0] * 0.5,
  HERO_BUST_OFFSET[1] + HERO_BUST_SIZE[1] * 0.55,
];

// Dissolve parameters — the Cinematic Cheat Sheet from research:
const DISSOLVE_BAND = 0.06;        // injection front width
const DISSOLVE_ROLLOFF = 0.04;     // composite hide smoothstep window
const NOISE_SCALE = 5.0;           // 4-6 is the sweet spot
const WARP = 0.32;                 // 0.25-0.40 organic
const BIAS = 0;                    // 0=top-down, 1=bottom-up, 2=radial out
const BIAS_AMT = 0.6;              // 0.55-0.75 organic
const INK_GAIN = 1.0;              // <=1.4 to avoid clipping
const DRIP_STRENGTH = 540;         // 250-900
const DISPERSE_STRENGTH = 130;     // <= drip/3
const VEL_JITTER = 0.25;           // 0-0.4
const RIM_INTENSITY = 0.36;        // 0.25-0.5

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

// ---- Shared dissolve helpers used by inject + composite ----
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

  // Bust UV from viewport UV (hero-state framing)
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

  // Front band — pixels currently transitioning right now
  float front = smoothstep(u_progress - u_band, u_progress, thr)
              * (1.0 - smoothstep(u_progress, u_progress + u_band, thr));

  // Highlight-weighted deposit so the bust's bright planes bleed more ink
  float lum = dot(bust.rgb, vec3(0.299, 0.587, 0.114));
  vec3 deposit = u_inkColor * mix(0.5, 1.4, lum) * bust.a * u_inkGain;

  // Frame-rate independent — at 60fps dt~1/60, so * 60 ≈ 1.0
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
uniform vec2 u_vignetteCenter;
uniform vec2 u_vignetteRadius;
uniform float u_vignetteSoft;
uniform int u_bias;
uniform float u_biasAmt;
uniform float u_noiseScale;
uniform float u_warp;
out vec4 fragColor;
${DISSOLVE_HEADER}
void main() {
  vec3 dye = texture(u_dye, v_uv).rgb;
  vec3 fluid = u_canvasColor + dye;

  vec2 bUV = (v_uv - u_heroOffset) / u_heroSize;
  bool inside = bUV.x >= 0.0 && bUV.x <= 1.0 && bUV.y >= 0.0 && bUV.y <= 1.0;

  if (!inside) {
    fragColor = vec4(fluid, 1.0);
    return;
  }

  vec4 bust = texture(u_bust, bUV);

  // Soft elliptical vignette so the bust silhouette dissolves into fluid
  vec2 d = (bUV - u_vignetteCenter) / u_vignetteRadius;
  float r = dot(d, d);
  float vignette = 1.0 - smoothstep(1.0 - u_vignetteSoft, 1.0, r);
  float bustAlpha = bust.a * vignette;

  // Dissolve mask: 1 still bust, 0 fully fluid
  float thr = dissolveThreshold(bUV, u_bias, u_biasAmt, u_noiseScale, u_warp);
  float visible = 1.0 - smoothstep(u_progress - u_rolloff,
                                   u_progress + u_rolloff, thr);

  // Gaussian-profile rim glow centred on the dissolve front — burning paper
  float gaussian = exp(-pow((thr - u_progress) / u_rolloff, 2.0) * 3.0);
  vec3 rim = u_rimColor * gaussian * u_rimIntensity * bustAlpha;

  vec3 col = mix(fluid, bust.rgb, visible * bustAlpha) + rim;
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
    console.error(`[BridgeFluid] shader compile (${label}):`, log);
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
    console.error(`[BridgeFluid] program link (${label}):`, log);
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

class BridgeFluidSim {
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
  private rafId = 0;
  private lastTime = 0;
  private lastAutoSplat = 0;
  public dissolveProgress = 0;
  private startedAt = 0;
  private paused = false;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private internalFormat: number;
  private internalFormatRG: number;
  private internalFormatR: number;
  private floatType: number;

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
    this.bindEvents();
    this.lastTime = performance.now();
    this.lastAutoSplat = this.lastTime;
    this.startedAt = this.lastTime;

    loadImageTexture(gl, "/bust.png")
      .then((tex) => {
        this.bustTex = tex;
      })
      .catch((e) => console.error("[BridgeFluid] bust load:", e));

    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);

    // Seed fluid so it isn't empty at progress 0
    setTimeout(() => this.autoSplat(0.4, 0.5), 80);
    setTimeout(() => this.autoSplat(0.55, 0.4), 280);
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

  private getResolution(target: number) {
    const ratio = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    if (ratio < 1) return { w: target, h: Math.round(target / ratio) };
    return { w: Math.round(target * ratio), h: target };
  }

  private bindEvents() {
    const c = this.canvas;
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
    const px = x ?? 0.3 + Math.random() * 0.55;
    const py = y ?? 0.25 + Math.random() * 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = 800 * (0.6 + Math.random() * 0.6);
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
      // Bust still loading — skip composite, just fluid this frame.
      // Output a clean canvas so we don't briefly sample the dye FBO
      // through the u_bust uniform on first frames.
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

    // canvas color #14110d ≈ rgb(0.078, 0.067, 0.051)
    gl.uniform3f(p.uniforms["u_canvasColor"]!, 0.078, 0.067, 0.051);
    // rim — slightly hotter than ink
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
    gl.uniform2f(p.uniforms["u_vignetteCenter"]!, 0.5, 0.52);
    gl.uniform2f(p.uniforms["u_vignetteRadius"]!, 0.42, 0.55);
    gl.uniform1f(p.uniforms["u_vignetteSoft"]!, 0.18);
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

    // INJECT before STEP — research agent's key ordering insight: ink and
    // velocity injected this frame get advected by this same frame's
    // simulation, so the dissolved ink lives in the current's currents
    // rather than lagging behind by a frame.
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
  }
}

export function BridgeFluid({
  dissolveProgress,
}: {
  dissolveProgress: MotionValue<number>;
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

    let sim: BridgeFluidSim | null = null;
    try {
      sim = new BridgeFluidSim(canvas);
    } catch (err) {
      console.warn("[BridgeFluid] disabled:", err);
    }

    const unsub = dissolveProgress.on("change", (v) => {
      if (sim) sim.dissolveProgress = Math.max(0, Math.min(1, v));
    });
    if (sim)
      sim.dissolveProgress = Math.max(0, Math.min(1, dissolveProgress.get()));

    return () => {
      unsub();
      sim?.dispose();
    };
  }, [dissolveProgress]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
      style={{ background: "var(--color-canvas)" }}
    />
  );
}
