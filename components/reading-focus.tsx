"use client";

import { useEffect } from "react";

type Props = {
  /** CSS selector for paragraphs to drift in/out of focus. */
  selector?: string;
  /** Opacity applied to non-focused paragraphs. Defaults to 0.7. */
  inactiveOpacity?: number;
};

/**
 * Behavior-only component. Dims every targeted paragraph except the one
 * whose vertical center is closest to the viewport center, mimicking a
 * "now reading" focus. All work happens in a single rAF-throttled
 * scroll handler with imperative DOM writes — no React state, no
 * per-paragraph re-renders.
 *
 * Honors `prefers-reduced-motion: reduce` by skipping the effect.
 */
export function ReadingFocus({
  selector = "article p, [data-reading-focus] p",
  inactiveOpacity = 0.7,
}: Props) {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    if (els.length === 0) return;

    for (const el of els) {
      el.style.transition = "opacity 600ms ease-out";
    }

    let active: HTMLElement | null = null;
    let scheduled = false;
    let raf = 0;
    const inactive = String(inactiveOpacity);

    const flush = () => {
      raf = 0;
      if (!scheduled) return;
      scheduled = false;

      const target = window.innerHeight / 2;
      let nearest: HTMLElement | null = null;
      let nearestDist = Infinity;

      for (const el of els) {
        const rect = el.getBoundingClientRect();
        // Skip elements with no layout (display:none, etc.).
        if (rect.height === 0) continue;
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - target);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = el;
        }
      }

      if (nearest && nearest !== active) {
        active = nearest;
        for (const el of els) {
          el.style.opacity = el === active ? "1" : inactive;
        }
      }
    };

    const onScroll = () => {
      scheduled = true;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    // Prime once so the initial visible paragraph gets focus before any scroll.
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const el of els) {
        el.style.opacity = "";
        el.style.transition = "";
      }
    };
  }, [selector, inactiveOpacity]);

  return null;
}
