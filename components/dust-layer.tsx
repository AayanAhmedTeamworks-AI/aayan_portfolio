"use client";

import { useEffect, useRef } from "react";

/**
 * Site-wide dust — slow-drifting cream motes rendered to a fixed Canvas2D
 * over everything. Cursor proximity disperses them: pass within ~90px and
 * the particle fades out fast, then respawns somewhere else.
 *
 * 60 particles, soft radial-gradient render, ~0.12-0.18 px/frame drift
 * (≈8-11 px/sec at 60fps — almost imperceptible). Wraps around viewport
 * edges. prefers-reduced-motion returns null. RAF loop.
 */

const PARTICLE_COUNT = 60;
const CURSOR_RADIUS = 90;
const FADE_RATE = 0.06;
const FADE_IN_RATE = 0.005;
const DRIFT_BASE = 0.12;
const DRIFT_VAR = 0.06;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  birthOpacity: number;
  state: "fadingIn" | "alive" | "dispersing";
};

export function DustLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = window.innerWidth;
    let h = window.innerHeight;
    let cursorX = -1000;
    let cursorY = -1000;
    let raf = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (p: Particle) => {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      const angle = Math.random() * Math.PI * 2;
      const speed = DRIFT_BASE + Math.random() * DRIFT_VAR;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.opacity = 0;
      p.birthOpacity = 0.18 + Math.random() * 0.22;
      p.size = 1.2 + Math.random() * 1.8;
      p.state = "fadingIn";
    };

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p: Particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        opacity: 0,
        size: 0,
        birthOpacity: 0,
        state: "fadingIn",
      };
      spawn(p);
      // stagger initial fade-in so they don't all bloom at once
      p.opacity = Math.random() * p.birthOpacity * 0.6;
      particles.push(p);
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      const cursorR2 = CURSOR_RADIUS * CURSOR_RADIUS;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges so particles always have somewhere to go
        const margin = 30;
        if (p.x < -margin) p.x = w + margin;
        if (p.x > w + margin) p.x = -margin;
        if (p.y < -margin) p.y = h + margin;
        if (p.y > h + margin) p.y = -margin;

        const dx = p.x - cursorX;
        const dy = p.y - cursorY;
        const distSq = dx * dx + dy * dy;
        const inRange = distSq < cursorR2;

        if (inRange) {
          // Cursor pushed it — disperse fast, scaled by closeness
          const dist = Math.sqrt(distSq);
          const falloff = 1 - dist / CURSOR_RADIUS;
          p.opacity -= FADE_RATE * (0.4 + 0.6 * falloff);
          p.state = "dispersing";
          // Slight push away so the particle drifts off
          if (dist > 0.5) {
            p.vx += (dx / dist) * 0.15;
            p.vy += (dy / dist) * 0.15;
          }
        } else if (p.state === "dispersing") {
          // Keep fading even after cursor leaves — once dispersed, gone
          p.opacity -= FADE_RATE * 0.4;
        } else if (p.state === "fadingIn") {
          p.opacity = Math.min(p.birthOpacity, p.opacity + FADE_IN_RATE);
          if (p.opacity >= p.birthOpacity) p.state = "alive";
        }

        if (p.opacity <= 0.001) {
          spawn(p);
          continue;
        }

        // Soft radial-gradient render so particles read as motes, not pixels
        const radius = p.size * 3.5;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        g.addColorStop(0, `rgba(244, 236, 220, ${p.opacity})`);
        g.addColorStop(0.5, `rgba(244, 236, 220, ${p.opacity * 0.4})`);
        g.addColorStop(1, "rgba(244, 236, 220, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    };
    const onLeave = () => {
      cursorX = -1000;
      cursorY = -1000;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70]"
    />
  );
}
