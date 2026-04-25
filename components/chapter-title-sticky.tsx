"use client";

import { useEffect, useRef, useState } from "react";
import { Meander } from "./meander";

type Props = {
  /** Roman numeral only, e.g. "I", "II", "III", "IV". Becomes a named
   *  view-transition target via `.chapter-numeral-{lower}`. */
  numeral: string;
  /** Chapter word displayed after the numeral, e.g. "Praxis". */
  chapter: string;
  /** The big display heading underneath the numeral line. */
  label: string;
  tagline?: string;
};

/**
 * Drop-in alternative to `<ChapterHeading>` that pins a small running
 * head ("{numeral} · {chapter}") to the top of the viewport once the
 * reader has scrolled past the full heading. Sticky state is driven by
 * a single IntersectionObserver on a 1px sentinel — no scroll handler,
 * no per-scroll setState.
 */
export function ChapterTitleSticky({ numeral, chapter, label, tagline }: Props) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // Sticky only when the sentinel has scrolled ABOVE the viewport,
        // not when it is below (initial load / overscroll up).
        const above = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setSticky(above);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  const vtClass = `chapter-numeral-${numeral.toLowerCase().replace(/\W+/g, "")}`;

  return (
    <>
      <div className="flex items-end justify-between gap-8 border-b border-hairline pb-8">
        <div className="min-w-0">
          <p className="mb-3 font-serif text-xl italic tracking-tight text-sepia/85 md:text-2xl">
            <span className={vtClass}>{numeral}</span>
            <span className="text-sepia/70"> · {chapter}</span>
          </p>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.03em] text-ink md:text-7xl">
            {label}
          </h1>
          {tagline ? (
            <p className="mt-6 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.24em] text-mute">
              {tagline}
            </p>
          ) : null}
        </div>
        <Meander className="mb-4 hidden h-3 w-40 shrink-0 text-sepia/55 md:block" />
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
