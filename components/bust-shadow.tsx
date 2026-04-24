"use client";

import { useEffect, useRef } from "react";
import { scrollProgressRef } from "@/lib/scroll-progress";

/**
 * Soft directional shadow — the one the key light ought to throw from the
 * bust toward the text column. A single absolute-positioned div with a
 * warm multiply radial gradient. Opacity couples to Lenis scroll progress
 * so as the bust recedes in z, the shadow softens — but never vanishes.
 *
 * Imperative RAF loop writes opacity directly; no React re-render churn.
 * Desktop only — on mobile the bust fills the full hero and a left-side
 * cast shadow would read as "dark half" rather than shading.
 */
export function BustShadow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const p = scrollProgressRef.current;
        // 0.22 full at top of page → 0.088 at maximum scroll (scroll * 0.6 fade)
        const alpha = 0.22 * Math.max(0, 1 - p * 0.6);
        el.style.opacity = String(alpha);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-[2] hidden md:block"
      style={{
        width: "58%",
        opacity: 0.22,
        mixBlendMode: "multiply",
        willChange: "opacity",
        background:
          "radial-gradient(ellipse 55% 45% at 32% 50%, rgba(26,22,19,0.55) 0%, rgba(26,22,19,0.18) 38%, transparent 72%)",
      }}
    />
  );
}
