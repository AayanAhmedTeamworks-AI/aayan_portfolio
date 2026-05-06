"use client";

import { useEffect, useRef } from "react";

/**
 * Hero fluid — golden-ink-in-dark-water WebGL2 stable-fluids simulation.
 * Built on Jos Stam's stable-fluids algorithm via the canonical Pavel
 * Dobryakov reference implementation, ported to clean TypeScript and
 * stripped to the parts we need (advection, vorticity, projection, dye).
 *
 * Phase 1: fluid only. Auto-splats at slow cadence + cursor force splats.
 * Sepia dye on canvas-coloured background. No bust composite yet, no glyph
 * injection yet — those land in Phase 2 / Phase 3.
 *
 * Performance: sim resolution 128×72, dye resolution 512×288, DPR clamped
 * to 1.5, RAF loop pauses when canvas leaves viewport.
 */

const SIM_RES = 128;
const DYE_RES = 512;
const DENSITY_DISSIPATION = 0.94;
const VELOCITY_DISSIPATION = 0.22;
const PRESSURE_DISSIPATION = 0.82;
const PRESSURE_ITERATIONS = 20;
const CURL = 26;
const SPLAT_RADIUS = 0.22;
const SPLAT_FORCE_CURSOR = 1400;
const SPLAT_FORCE_AUTO = 1100;
const AUTO_SPLAT_INTERVAL_MS = 3800;
const GLYPH_INTERVAL_MS = 9000;
const GLYPH_FIRST_DELAY_MS = 3200;
const GLYPHS = ["ॐ", "ع"];

// Sepia (#c9a06a) ≈ rgb(0.789, 0.628, 0.416) — divided by ~3 for slow build-up
const INK_COLOR: [number, number, number] = [0.26, 0.21, 0.14];

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

const DISPLAY = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_dye;
out vec4 fragColor;
void main() {
  vec3 c = texture(u_dye, v_uv).rgb;
  fragColor = vec4(c, 1.0);
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
    console.error(`[HeroFluid] shader compile failed (${label}):`, log);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error (${label}): ` + log);
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
    console.error(`[HeroFluid] program link failed (${label}):`, log);
    throw new Error(`Program link error (${label}): ` + log);
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

class FluidSim {
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
    display: Program;
    glyphInject: Program;
  };
  private velocity!: DoubleFBO;
  private dye!: DoubleFBO;
  private pressure!: DoubleFBO;
  private divergence!: FBO;
  private curl!: FBO;
  private vao!: WebGLVertexArrayObject;
  private glyphTextures: WebGLTexture[] = [];
  private rafId = 0;
  private lastTime = 0;
  private lastAutoSplat = 0;
  private lastGlyphInject = 0;
  private cursor = {
    x: -1,
    y: -1,
    dx: 0,
    dy: 0,
    moved: false,
    inside: false,
  };
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
    const colorBufferFloat = gl.getExtension("EXT_color_buffer_float");
    if (!colorBufferFloat) {
      console.warn(
        "[HeroFluid] EXT_color_buffer_float not available — fluid sim may render incorrectly",
      );
    }
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("OES_texture_half_float_linear");

    this.internalFormat = gl.RGBA16F;
    this.internalFormatRG = gl.RG16F;
    this.internalFormatR = gl.R16F;
    this.floatType = gl.HALF_FLOAT;

    this.initVAO();
    this.initPrograms();
    this.initFBOs();
    this.initGlyphs();
    this.bindEvents();
    this.lastTime = performance.now();
    this.lastAutoSplat = this.lastTime;
    // Stagger first glyph injection — wait GLYPH_FIRST_DELAY_MS after init
    this.lastGlyphInject =
      this.lastTime - GLYPH_INTERVAL_MS + GLYPH_FIRST_DELAY_MS;
    this.tick = this.tick.bind(this);
    this.rafId = requestAnimationFrame(this.tick);

    // Seed the canvas with a couple of initial splats so it's not empty
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
      display: createProgram(gl, DISPLAY, "display"),
      glyphInject: createProgram(gl, GLYPH_INJECT, "glyphInject"),
    };
    // a_position is bound to location 0 via `layout(location = 0)` in the
    // vertex shader, matching the VAO's vertexAttribPointer(0, …).
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
    const gl = this.gl;
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

  private injectGlyph() {
    const gl = this.gl;
    if (this.glyphTextures.length === 0) return;
    const aspect = this.canvas.width / this.canvas.height;

    const idx = Math.floor(Math.random() * this.glyphTextures.length);
    const tex = this.glyphTextures[idx];

    // Position the glyph in zones where the ink is actually visible —
    // not buried behind the opaque centre of the bust photo. Three zones:
    // above the bust, below the bust, in the gap to the bust's left.
    const zone = Math.random();
    let cx: number;
    let cy: number;
    if (zone < 0.34) {
      // above the bust (upper half of the right two-thirds)
      cx = 0.4 + Math.random() * 0.5;
      cy = 0.8 + Math.random() * 0.13;
    } else if (zone < 0.67) {
      // below the bust
      cx = 0.4 + Math.random() * 0.5;
      cy = 0.08 + Math.random() * 0.13;
    } else {
      // gap between the name on the left and the bust on the right
      cx = 0.4 + Math.random() * 0.16;
      cy = 0.32 + Math.random() * 0.36;
    }

    // Scale: ~18-26% of canvas height. Compensate aspect so the glyph
    // is square in screen space.
    const sy = 0.18 + Math.random() * 0.08;
    const sx = sy / aspect;

    // Sepia, brighter — so glyph clearly reads against existing dye.
    const intensity = 1.0;
    const color: [number, number, number] = [
      Math.min(2.0, INK_COLOR[0] * intensity * 4.5),
      Math.min(2.0, INK_COLOR[1] * intensity * 4.5),
      Math.min(2.0, INK_COLOR[2] * intensity * 4.5),
    ];

    // Inject glyph into dye field
    const p = this.programs.glyphInject;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_target"]!, this.dye.read.attach(0));
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.uniforms["u_glyph"]!, 1);
    gl.uniform2f(p.uniforms["u_center"]!, cx, cy);
    gl.uniform2f(p.uniforms["u_scale"]!, sx, sy);
    gl.uniform3f(
      p.uniforms["u_color"]!,
      color[0],
      color[1],
      color[2],
    );
    this.blit(this.dye.write);
    this.dye.swap();

    // Small radial outward velocity burst around the glyph so it
    // immediately starts blooming into illegibility — eight tangents
    // around a ring at half the glyph radius. Gentler than auto-splats
    // so the glyph stays recognisable for ~2s before dispersing.
    const burstForce = 170;
    const ringRadius = sy * 0.45;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = cx + (Math.cos(angle) * ringRadius) / aspect;
      const py = cy + Math.sin(angle) * ringRadius;
      const dx = Math.cos(angle) * burstForce;
      const dy = Math.sin(angle) * burstForce;
      this.splatVelocity(px, py, dx, dy, 0.4);
    }
  }

  private getResolution(target: number) {
    const ratio = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    if (ratio < 1) {
      return { w: target, h: Math.round(target / ratio) };
    }
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

  private cleanups: Array<() => void> = [];

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
    radiusScale = 1,
  ) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const radius = (SPLAT_RADIUS / 100) * radiusScale;
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
    radiusScale = 1,
  ) {
    const gl = this.gl;
    const aspect = this.canvas.width / this.canvas.height;
    const radius = (SPLAT_RADIUS / 100) * radiusScale;
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

  private splatInk(
    x: number,
    y: number,
    dx: number,
    dy: number,
    color: [number, number, number],
  ) {
    this.splatVelocity(x, y, dx, dy);
    this.splatDye(x, y, color);
  }

  private autoSplat(x?: number, y?: number) {
    // Random position biased to right two-thirds (matches "off-axis right" bust placement);
    // for now (Phase 1, no bust) we still bias right so the composition is set up.
    const px = x ?? 0.4 + Math.random() * 0.55;
    const py = y ?? 0.25 + Math.random() * 0.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = SPLAT_FORCE_AUTO * (0.6 + Math.random() * 0.6);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const variance = 0.85 + Math.random() * 0.3;
    const color: [number, number, number] = [
      INK_COLOR[0] * variance,
      INK_COLOR[1] * variance,
      INK_COLOR[2] * variance,
    ];
    this.splatInk(px, py, dx, dy, color);
  }

  private cursorSplat() {
    if (!this.cursor.moved || !this.cursor.inside) return;
    const dx = this.cursor.dx * SPLAT_FORCE_CURSOR;
    const dy = this.cursor.dy * SPLAT_FORCE_CURSOR;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      this.cursor.moved = false;
      return;
    }
    // Velocity only — cursor disturbs the field (so glyphs distort) but
    // does not add new dye, so there are no flame trails behind the pointer.
    this.splatVelocity(this.cursor.x, this.cursor.y, dx, dy);
    this.cursor.moved = false;
  }

  private step(dt: number) {
    const gl = this.gl;
    gl.disable(gl.BLEND);

    // Curl
    {
      const p = this.programs.curl;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(0),
      );
      this.blit(this.curl);
    }

    // Vorticity
    {
      const p = this.programs.vorticity;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(0),
      );
      gl.uniform1i(p.uniforms["u_curl"]!, this.curl.attach(1));
      gl.uniform1f(p.uniforms["u_curlStrength"]!, CURL);
      gl.uniform1f(p.uniforms["u_dt"]!, dt);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }

    // Divergence
    {
      const p = this.programs.divergence;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(0),
      );
      this.blit(this.divergence);
    }

    // Decay pressure
    {
      const p = this.programs.clear;
      gl.useProgram(p.prog);
      gl.uniform1i(p.uniforms["u_source"]!, this.pressure.read.attach(0));
      gl.uniform1f(p.uniforms["u_value"]!, PRESSURE_DISSIPATION);
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    // Pressure (Jacobi)
    {
      const p = this.programs.pressure;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_divergence"]!,
        this.divergence.attach(0),
      );
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(
          p.uniforms["u_pressure"]!,
          this.pressure.read.attach(1),
        );
        this.blit(this.pressure.write);
        this.pressure.swap();
      }
    }

    // Gradient subtract
    {
      const p = this.programs.gradSubtract;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_pressure"]!,
        this.pressure.read.attach(0),
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(1),
      );
      this.blit(this.velocity.write);
      this.velocity.swap();
    }

    // Advect velocity
    {
      const p = this.programs.advection;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.velocity.texelSizeX,
        this.velocity.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(0),
      );
      gl.uniform1i(p.uniforms["u_source"]!, this.velocity.read.attach(0));
      gl.uniform1f(p.uniforms["u_dt"]!, dt);
      gl.uniform1f(p.uniforms["u_dissipation"]!, VELOCITY_DISSIPATION);
      this.blit(this.velocity.write);
      this.velocity.swap();
    }

    // Advect dye
    {
      const p = this.programs.advection;
      gl.useProgram(p.prog);
      gl.uniform2f(
        p.uniforms["u_texelSize"]!,
        this.dye.texelSizeX,
        this.dye.texelSizeY,
      );
      gl.uniform1i(
        p.uniforms["u_velocity"]!,
        this.velocity.read.attach(0),
      );
      gl.uniform1i(p.uniforms["u_source"]!, this.dye.read.attach(1));
      gl.uniform1f(p.uniforms["u_dt"]!, dt);
      gl.uniform1f(p.uniforms["u_dissipation"]!, DENSITY_DISSIPATION);
      this.blit(this.dye.write);
      this.dye.swap();
    }
  }

  private render() {
    const gl = this.gl;
    const p = this.programs.display;
    gl.useProgram(p.prog);
    gl.uniform1i(p.uniforms["u_dye"]!, this.dye.read.attach(0));
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

export function HeroFluid({ className }: { className?: string }) {
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

    let sim: FluidSim | null = null;
    try {
      sim = new FluidSim(canvas);
    } catch (err) {
      console.warn("HeroFluid disabled:", err);
    }
    return () => {
      sim?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        "block h-full w-full " + (className ?? "")
      }
      style={{ background: "var(--color-canvas)" }}
    />
  );
}
