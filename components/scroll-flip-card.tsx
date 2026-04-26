"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the spring fires after coming into view. */
  delay?: number;
  /** Duration of the spring. Default 2s — slow, deliberate. */
  duration?: number;
  /** Vertical travel in px from initial state. */
  travel?: number;
};

/**
 * Scroll-flip card — the Patel "card floats into the billboard" entry.
 *
 * Initial state: translated 200 px below resting, rotated 90° on X with
 * a 1200 px perspective so the card looks like a postcard angled away
 * from the viewer. Animates to flat / 0 / scale 1 with a critically-
 * damped spring (bounce 0, duration 2 s) once the wrapper enters view.
 *
 * Fires once via `useInView({ once: true })` — no per-frame work after
 * the entry resolves. Honors `prefers-reduced-motion` (skips animation,
 * renders flat).
 */
export function ScrollFlipCard({
  children,
  className,
  delay = 0.25,
  duration = 2,
  travel = 200,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const reduce = useReducedMotion();

  const flat = {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
  } as const;

  const initial = reduce
    ? flat
    : {
        opacity: 1,
        y: travel,
        rotateX: 90,
        scale: 0.95,
      };

  const target = reduce ? flat : inView ? flat : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={target}
      transition={{ type: "spring", bounce: 0, duration, delay }}
      style={{
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        transformOrigin: "center bottom",
        willChange: "transform, opacity",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
