"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

/**
 * BridgeFluid — fluid simulation + depth-displaced bust quad sharing one
 * cameraZ uniform. Stable-fluids algorithm under the hood (same as
 * HeroFluid), but the final display pass is a composite shader that:
 *
 *   - Samples bust albedo (/public/bust.png) at a cameraZ-dollied UV
 *   - Samples bust depth (/public/bust-depth.webp) for per-pixel parallax
 *   - Applies turbulence-based displacement gated by depth (hair only)
 *   - Composites the bust over the fluid dye
 *   - Applies subtle gold chromatic aberration near climax (cameraZ ≥ 0.7)
 *
 * cameraZ:
 *   0 → bust occupies the right column at hero scale
 *   1 → camera has dollied through the right eye; pupil pixel-centred,
 *        ready to hand off to the iris reveal in <MuseumTransition/>
 */

const SIM_RES = 96;
const DYE_RES = 384;
const DENSITY_DISSIPATION = 0.94;
const VELOCITY_DISSIPATION = 0.22;
const PRESSURE_DISSIPATION = 0.82;
const PRESSURE_ITERATIONS = 14;
const CURL = 24;
const SPLAT_RADIUS = 0.22;
const AUTO_SPLAT_INTERVAL_MS = 4500;
const INK_COLOR: [number, number, number] = [0.22, 0.18, 0.12];

// Right eye pupil in bust-photo UV space (his right, viewer's left).
// Tuned in 0.01-0.02 increments until the pupil sits dead-centre at climax.
const EYE_UV: [number, number] = [0.38, 0.30];

// Bust framing in viewport UV at cameraZ=0 (hero state — bust on the
// right column, vertically centred, occupying ~33% × 70% of the viewport).
const HERO_BUST_OFFSET: [number, number] = [0.6, 0.14];
const HERO_BUST_SIZE: [number, number] = [0.34, 0.72];

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

/**
 * COMPOSITE — final display pass. Camera dollies into the bust's right
 * eye as cameraZ grows from 0 to 1. Per-pixel parallax via the depth
 * map; turbulence-driven hair displacement gated by depth threshold;
 * gold chromatic aberration fringe near climax.
 */
const COMPOSITE = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_dye;
uniform sampler2D u_bust;
uniform sampler2D u_bustDepth;
uniform float u_cameraZ;
uniform float u_time;
uniform float u_aspectRatio;
uniform vec2 u_eyeUV;
uniform vec2 u_heroOffset;
uniform vec2 u_heroSize;
out vec4 fragColor;

const vec3 CANVAS = vec3(0.078, 0.067, 0.051);
const float HAIR_THRESHOLD = 0.78;
const float PARALLAX_STRENGTH = 0.22;

// Approximate viridis-colormap → depth decoder. The depth file is a
// false-colour MiDaS-style map: dark blue/purple is far, bright
// yellow/cream is near. This isn't perfect but is monotonic enough
// for parallax displacement.
float decodeDepth(vec3 rgb) {
  return clamp(rgb.r * 0.55 + rgb.g * 0.45 - rgb.b * 0.35 + 0.18, 0.0, 1.0);
}

// 2D hash + value noise for hair turbulence
float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 vp = v_uv;

  // ---- Background dye ----
  vec3 dye = texture(u_dye, vp).rgb;
  vec3 bg = CANVAS + dye;

  // ---- Bust framing ----
  // At cameraZ=0: bust occupies HERO_BUST_OFFSET..+HERO_BUST_SIZE region.
  // At cameraZ=1: bust is heavily zoomed; eyeUV maps to viewport (0.5, 0.5)
  //   and the eye fills the centre. We compute an interpolated frame.
  // Climax bust size (in viewport units) — small means heavy zoom.
  float climaxSizeY = 0.06;
  float climaxSizeX = climaxSizeY * (u_heroSize.x / u_heroSize.y);
  vec2 climaxSize = vec2(climaxSizeX, climaxSizeY);
  vec2 climaxOffset = vec2(0.5) - u_eyeUV * climaxSize;

  // Smoothstep the dolly so it eases in/out
  float t = smoothstep(0.0, 1.0, u_cameraZ);
  vec2 size = mix(u_heroSize, climaxSize, t);
  vec2 offset = mix(u_heroOffset, climaxOffset, t);

  // Bust UV (where in the bust photo we sample for this viewport pixel)
  vec2 bUV = (vp - offset) / size;

  // Outside bust frame → fluid only
  if (bUV.x < 0.0 || bUV.x > 1.0 || bUV.y < 0.0 || bUV.y > 1.0) {
    fragColor = vec4(bg, 1.0);
    return;
  }

  // ---- Per-pixel parallax via depth ----
  float depth = decodeDepth(texture(u_bustDepth, bUV).rgb);
  float eyeDepth = decodeDepth(texture(u_bustDepth, u_eyeUV).rgb);
  float depthDelta = depth - eyeDepth;
  vec2 parallaxDir = bUV - u_eyeUV;
  vec2 parallaxedUV = bUV + parallaxDir * depthDelta * PARALLAX_STRENGTH * t;

  // ---- Hair turbulence (depth-gated) ----
  float hairMask = smoothstep(HAIR_THRESHOLD, HAIR_THRESHOLD + 0.12, depth);
  if (hairMask > 0.001) {
    vec2 nUV = bUV * 9.0 + vec2(u_time * 0.18, u_time * 0.11);
    float nx = vnoise(nUV) - 0.5;
    float ny = vnoise(nUV + vec2(31.7, 17.3)) - 0.5;
    vec2 turb = vec2(nx, ny) * 2.0;
    parallaxedUV += turb * 0.018 * hairMask * (0.4 + t);
  }

  // ---- Sample bust albedo (with optional chromatic aberration) ----
  vec4 bustC;
  if (u_cameraZ > 0.65) {
    float ca = (u_cameraZ - 0.65) / 0.35;
    vec2 caDir = (parallaxedUV - u_eyeUV) * 0.012 * ca;
    float r = texture(u_bust, parallaxedUV + caDir * vec2(1.0, 0.6)).r;
    float g = texture(u_bust, parallaxedUV).g;
    float b = texture(u_bust, parallaxedUV - caDir * vec2(0.8, 1.0)).b;
    float a = texture(u_bust, parallaxedUV).a;
    // Slight gold tint on the R channel
    r = mix(r, r * 1.04, ca);
    bustC = vec4(r, g, b, a);
  } else {
    bustC = texture(u_bust, parallaxedUV);
  }

  // Soft alpha falloff at the bust silhouette so edges dissolve into
  // the fluid (Caravaggio framing — same as the hero's vignette mask).
  vec2 m = bUV - vec2(0.5, 0.52);
  m.x /= 0.58;
  m.y /= 0.68;
  float vignette = 1.0 - smoothstep(0.5, 1.0, length(m));
  float bustAlpha = bustC.a * vignette;

  // Composite bust over fluid
  vec3 final = mix(bg, bustC.rgb, bustAlpha);

  fragColor = vec4(final, 1.0);
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
    composite: Program;
  };
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private vao!: WebGLVertexArrayObject;
  private bustTex: WebGLTexture | null = null;
  private depthTex: WebGLTexture | null = null;
  private rafId = 0;
  private lastTime = 0;
  private lastAutoSplat = 0;
  public cameraZ = 0;
  private startedAt = 0;
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
    this.bindEvents();
    this.lastTime = performance.now();
    this.lastAutoSplat = this.lastTime;
    this.startedAt = this.lastTime;

    // Async load bust + depth textures
    Promise.all([
      loadImageTexture(gl, "/bust.png"),
      loadImageTexture(gl, "/bust-depth.webp"),
    ])
      .then(([b, d]) => {
        this.bustTex = b;
        this.depthTex = d;
      })
      .catch((e) => console.error("[BridgeFluid] texture load:", e));

    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);

    // Seed fluid so it's not empty
    setTimeout(() => this.autoSplat(0.5, 0.5), 80);
    setTimeout(() => this.autoSplat(0.32, 0.4), 280);
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
    const speed = 900 * (0.6 + Math.random() * 0.6);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const variance = 0.85 + Math.random() * 0.3;
    const color: [number, number, number] = [
      INK_COLOR[0] * variance,
      INK_COLOR[1] * variance,
      INK_COLOR[2] * variance,
    ];
    this.splatVelocity(px, py, dx, dy);
    this.splatDye(px, py, color);
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
    const p = this.programs.composite;
    gl.useProgram(p.prog);

    gl.uniform1i(p.uniforms["u_dye"]!, this.dye.read.attach(0));

    if (this.bustTex) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bustTex);
      gl.uniform1i(p.uniforms["u_bust"]!, 1);
    }
    if (this.depthTex) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.depthTex);
      gl.uniform1i(p.uniforms["u_bustDepth"]!, 2);
    }

    const aspect = this.canvas.width / this.canvas.height;
    const time = (performance.now() - this.startedAt) / 1000;
    gl.uniform1f(p.uniforms["u_cameraZ"]!, this.cameraZ);
    gl.uniform1f(p.uniforms["u_time"]!, time);
    gl.uniform1f(p.uniforms["u_aspectRatio"]!, aspect);
    gl.uniform2f(p.uniforms["u_eyeUV"]!, EYE_UV[0], EYE_UV[1]);
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

export function BridgeFluid({ cameraZ }: { cameraZ: MotionValue<number> }) {
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

    const unsub = cameraZ.on("change", (v) => {
      if (sim) sim.cameraZ = Math.max(0, Math.min(1, v));
    });
    if (sim) sim.cameraZ = Math.max(0, Math.min(1, cameraZ.get()));

    return () => {
      unsub();
      sim?.dispose();
    };
  }, [cameraZ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block h-full w-full"
      style={{ background: "var(--color-canvas)" }}
    />
  );
}
