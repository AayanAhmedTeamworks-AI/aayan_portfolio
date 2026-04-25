"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Meander } from "./meander";

type Props = {
  numeral: string;
  chapter: string;
  label: string;
  tagline?: string;
};

/**
 * Chapter cover — an immersive multi-layer reveal that runs on chapter
 * page mount, plus the sticky running-head behaviour previously in
 * ChapterTitleSticky. Replaces ChapterTitleSticky as a drop-in.
 *
 * Reveal sequence (all eased on cubic-bezier(0.16, 1, 0.3, 1)):
 *   t=0.10s — numeral · chapter line drops in from -16px, fades to 1
 *   t=0.40s — display heading clip-path wipes from baseline upward
 *   t=1.00s — tagline fades in
 *   t=1.20s — meander wipes left to right via clip-path
 *
 * Sticky behaviour: a 1px sentinel sits below the cover; when it scrolls
 * above the viewport, a fixed running head ("{numeral} · {chapter}")
 * fades in at the top.
 *
 * Honors prefers-reduced-motion (framer's useReducedMotion).
 */
export function ChapterCover({ numeral, chapter, label, tagline }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sticky, setSticky] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const above =
          !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setSticky(above);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const ease = [0.16, 1, 0.3, 1] as const;
  const numeralAnim = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: -16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: 0.1, ease },
      };
  const labelAnim = reduce
    ? { initial: { clipPath: "inset(0% 0 0 0)" }, animate: { clipPath: "inset(0% 0 0 0)" } }
    : {
        initial: { clipPath: "inset(100% 0 0 0)" },
        animate: { clipPath: "inset(0% 0 0 0)" },
        transition: { duration: 1.0, delay: 0.4, ease },
      };
  const taglineAnim = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.6, delay: 1.0, ease },
      };
  const meanderAnim = reduce
    ? { initial: { clipPath: "inset(0 0% 0 0)" }, animate: { clipPath: "inset(0 0% 0 0)" } }
    : {
        initial: { clipPath: "inset(0 100% 0 0)" },
        animate: { clipPath: "inset(0 0% 0 0)" },
        transition: { duration: 0.8, delay: 1.2, ease },
      };

  const vtClass = `chapter-numeral-${numeral
    .toLowerCase()
    .replace(/\W+/g, "")}`;

  return (
    <>
      <div className="flex items-end justify-between gap-8 border-b border-hairline pb-8">
        <div className="min-w-0">
          <motion.p
            {...numeralAnim}
            className="mb-3 font-serif text-xl italic tracking-tight text-sepia/85 md:text-2xl"
          >
            <span className={vtClass}>{numeral}</span>
            <span className="text-sepia/70"> · {chapter}</span>
          </motion.p>
          <motion.h1
            {...labelAnim}
            className="font-serif text-5xl leading-[0.95] tracking-[-0.03em] text-ink md:text-7xl"
          >
            {label}
          </motion.h1>
          {tagline ? (
            <motion.p
              {...taglineAnim}
              className="mt-6 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.24em] text-mute"
            >
              {tagline}
            </motion.p>
          ) : null}
        </div>
        <motion.div {...meanderAnim} className="hidden md:block shrink-0">
          <Meander className="mb-4 h-3 w-40 text-sepia/55" />
        </motion.div>
      </div>
      <div ref={sentinelRef} aria-hidden="true" className="h-[1px] w-full" />
      <div
        className={
          "fixed top-[3.5rem] left-1/2 -translate-x-1/2 z-[28] font-serif italic text-sepia text-[14px] transition-opacity duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none " +
          (sticky ? "opacity-100" : "opacity-0")
        }
        aria-hidden="true"
      >
        {numeral} · {chapter}
      </div>
    </>
  );
}
