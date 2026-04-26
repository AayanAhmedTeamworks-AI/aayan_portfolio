"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** The text to ink in. Whitespace is preserved as a non-breaking gap. */
  text: string;
  className?: string;
  /** Per-character stagger in seconds. Default 0.06s — slow, classical. */
  stagger?: number;
  /** Initial delay before the first character appears. */
  delay?: number;
  /** Duration of each character's reveal. */
  duration?: number;
  /** A trailing element rendered after the last character (e.g. punctuation). */
  trailing?: ReactNode;
};

/**
 * Hero ink-type — letter-by-letter mask reveal in the typewriter family,
 * but classical: no blinking caret, no monospace, no clack. Each glyph
 * starts behind a clip-path inset wiping bottom-up, with a small fade-in
 * staggered across the run. Reads as ink settling onto the page rather
 * than a terminal echoing.
 *
 * Used once on first paint of the hero name. After mount the characters
 * are inert plain text — no continuous animation, no per-frame work.
 *
 * Honors prefers-reduced-motion: characters render fully on mount.
 */
export function HeroInkType({
  text,
  className,
  stagger = 0.06,
  delay = 0.2,
  duration = 0.6,
  trailing,
}: Props) {
  const reduce = useReducedMotion();
  // Split into an array of glyphs while preserving whitespace as non-breaking.
  const glyphs = useMemo(() => Array.from(text), [text]);

  if (reduce) {
    return (
      <span className={cn("inline-block", className)}>
        {text}
        {trailing}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block", className)}
      aria-label={text}
    >
      {glyphs.map((g, i) => (
        <motion.span
          key={i}
          initial={{ clipPath: "inset(100% 0 0 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0% 0 0 0)", opacity: 1 }}
          transition={{
            duration,
            delay: delay + i * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
          aria-hidden="true"
          className="inline-block"
          style={{ whiteSpace: g === " " ? "pre" : undefined }}
        >
          {g === " " ? " " : g}
        </motion.span>
      ))}
      {trailing}
    </span>
  );
}
