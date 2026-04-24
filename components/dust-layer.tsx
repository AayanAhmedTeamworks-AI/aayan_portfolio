"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const PARTICLE_COUNT = 16;

/**
 * Site-wide 2D dust — the hero's atmosphere carried into every chapter.
 *
 * Sixteen absolutely-positioned `<span>`s with soft radial-gradient
 * backgrounds, each animated along an independent sine-eased path between
 * random viewport points over 40–60s. Opacity tweens from 0 to ~3.5% max
 * and back to 0 over the particle's lifetime, so they drift into and out
 * of visibility rather than popping in on respawn.
 *
 * Pure 2D — no WebGL, no second R3F canvas on chapter pages. Mounted once
 * in `app/layout.tsx` inside `<LenisRoot>`. Pauses on prefers-reduced-motion.
 * z-index sits below the cursor (70 vs 80).
 */
export function DustLayer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const container = containerRef.current;
    if (!container) return;

    const particles = Array.from(container.children) as HTMLElement[];
    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    const respawn = (p: HTMLElement) => {
      const sx = Math.random() * window.innerWidth;
      const sy = Math.random() * window.innerHeight;
      const ex = Math.random() * window.innerWidth;
      const ey = Math.random() * window.innerHeight;
      const duration = 40 + Math.random() * 20; // 40 – 60s
      const maxOpacity = 0.025 + Math.random() * 0.015; // 2.5% – 4%

      gsap.set(p, { x: sx, y: sy, opacity: 0 });

      const tl = gsap.timeline({ onComplete: () => respawn(p) });
      tl.to(p, { x: ex, y: ey, duration, ease: "sine.inOut" }, 0);
      // Fade in over the first third of the lifetime
      tl.to(
        p,
        { opacity: maxOpacity, duration: duration * 0.35, ease: "sine.in" },
        0,
      );
      // Fade out over the last third
      tl.to(
        p,
        { opacity: 0, duration: duration * 0.35, ease: "sine.out" },
        duration * 0.65,
      );
    };

    // Stagger starts so the sixteen don't rise and fall in unison
    particles.forEach((p, i) => {
      timeouts.push(
        setTimeout(() => respawn(p), i * 800 + Math.random() * 400),
      );
    });

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      particles.forEach((p) => gsap.killTweensOf(p));
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <span
          key={i}
          className="absolute block h-3 w-3 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(201,163,114,0.7) 0%, transparent 70%)",
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}
