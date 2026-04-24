"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 12;

/** Deterministic 0..1 sequence from (index, salt). Keeps server and client
 *  renders in sync (no hydration mismatch) while still looking random. */
function drand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Site-wide 2D dust.
 *
 * Twelve `<span>`s; each assigns unique `--sx / --sy / --ex / --ey / --dur
 * / --delay / --peak` CSS custom properties on mount, and the `.dust-particle`
 * class's single `dust-drift` @keyframes animation (in globals.css) uses
 * those vars to drive translate + opacity. Browser compositor runs the
 * animation — zero per-frame JS, zero concurrent GSAP timelines.
 *
 * Peak opacity is now 7–10% (was 2.5–4%, which was below the perceptual
 * threshold against the new darker canvas). Particle diameter bumped to
 * 20px. Pauses via the global `prefers-reduced-motion` rule that already
 * kills all animations.
 *
 * z-[70] sits below the cursor (z-[80]).
 */
export function DustLayer() {
  const ref = useRef<HTMLDivElement>(null);

  // Random endpoints get set once per mount. Deterministic salt per particle
  // keeps things stable between SSR and client paint; the final look only
  // depends on the particle index.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const spans = Array.from(el.children) as HTMLElement[];
    spans.forEach((s, i) => {
      const sx = drand(i, 1) * 100;
      const sy = drand(i, 2) * 100;
      const ex = drand(i, 3) * 100;
      const ey = drand(i, 4) * 100;
      const dur = 50 + drand(i, 5) * 25; // 50–75s
      // Negative delay so animations start mid-cycle and don't synchronise
      const delay = -drand(i, 6) * dur;
      const peak = 0.07 + drand(i, 7) * 0.03; // 7–10%
      s.style.setProperty("--sx", `${sx}vw`);
      s.style.setProperty("--sy", `${sy}vh`);
      s.style.setProperty("--ex", `${ex}vw`);
      s.style.setProperty("--ey", `${ey}vh`);
      s.style.setProperty("--dur", `${dur}s`);
      s.style.setProperty("--delay", `${delay}s`);
      s.style.setProperty("--peak", `${peak}`);
    });
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <span key={i} className="dust-particle" />
      ))}
    </div>
  );
}
