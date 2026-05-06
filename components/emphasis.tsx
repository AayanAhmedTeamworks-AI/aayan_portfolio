"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Inline emphasis for load-bearing sentences. A thin warm-gold rule draws
 * left-to-right beneath the wrapped text once it enters the viewport. The
 * text inside still participates in the parent <ScrollProse/>'s word-by-
 * word brightening — this is purely a typographic flourish on top.
 */
export function Emphasis({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  const reduce = useReducedMotion();

  return (
    <span ref={ref} className="relative inline">
      {children}
      <motion.span
        aria-hidden="true"
        initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.85, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "left center" }}
        className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] h-[1.5px] bg-sepia/75"
      />
    </span>
  );
}
