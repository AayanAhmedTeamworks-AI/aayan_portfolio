"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Sentence-by-sentence reveal for prose. Each <Sentence/> fades + lifts in as
 * it enters the viewport; the page reads itself like a turning page. Optional
 * `emphasis` draws a thin warm-gold underline left-to-right after the sentence
 * has resolved, treating it as a designer's pull-quote within the paragraph.
 *
 * Inline by design — render multiple Sentences inside a single <p> for
 * paragraph wrapping. Trailing space is included so word-spacing reads
 * correctly between sentences.
 */
export function Sentence({
  children,
  emphasis = false,
}: {
  children: ReactNode;
  emphasis?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -22% 0px" });
  const reduce = useReducedMotion();

  const initial = reduce ? false : { opacity: 0, y: 10 };
  const animate = inView ? { opacity: 1, y: 0 } : undefined;

  return (
    <motion.span
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline"
    >
      {children}
      {emphasis ? (
        <motion.span
          aria-hidden="true"
          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : undefined}
          transition={{
            duration: 0.85,
            delay: 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ transformOrigin: "left center" }}
          className="pointer-events-none absolute inset-x-0 -bottom-[0.18em] h-[1.5px] bg-sepia/75"
        />
      ) : null}{" "}
    </motion.span>
  );
}
