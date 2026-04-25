"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt at the resting (off-screen-bottom) state, in degrees. */
  tilt?: number;
  /** Minimum scale at the resting state. */
  scale?: number;
};

/**
 * Container-scroll reveal — the Aceternity-style "phone tilts back, then
 * lays flat as you scroll into it" effect, translated for the codex.
 *
 * The element starts tilted backward and slightly scaled-down. As its
 * vertical centre approaches the viewport centre, the tilt and scale
 * resolve to flat / 1.0. Element-local progress (no shared scroll state),
 * rAF-throttled, no React re-renders.
 *
 * Useful for figures, diagrams, and any block that should feel like it's
 * laying itself down on the page as the reader arrives at it.
 */
export function ContainerScroll({
  children,
  className,
  tilt = 16,
  scale = 0.94,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const node = ref.current;
    if (!node) return;

    if (reduced) {
      node.style.transform = "perspective(1200px) rotateX(0deg) scale(1)";
      return;
    }

    let raf = 0;
    let scheduled = false;

    const apply = () => {
      raf = 0;
      scheduled = false;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const elementCentre = rect.top + rect.height / 2;
      // 0 when element centre is at viewport bottom (untouched, full tilt)
      // 1 when element centre is above viewport centre (resolved, flat)
      // Travel band = bottom-of-viewport → centre-of-viewport.
      const t = Math.max(
        0,
        Math.min(1, (vh - elementCentre) / (vh * 0.55)),
      );
      const r = (tilt * (1 - t)).toFixed(2);
      const s = (scale + (1 - scale) * t).toFixed(4);
      el.style.transform = `perspective(1200px) rotateX(${r}deg) scale(${s})`;
    };

    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tilt, scale]);

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{ transformOrigin: "center top" }}
    >
      {children}
    </div>
  );
}
