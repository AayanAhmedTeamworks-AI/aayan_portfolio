"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Meander } from "@/components/meander";
import { BackgroundCaustic } from "@/components/background-caustic";
import { scrollProgressRef } from "@/lib/scroll-progress";

type Props = {
  numeral: string;
  chapter: string;
  nextNumeral: string;
  nextChapter: string;
  nextHref: string;
};

export function PageTurn({
  numeral,
  chapter,
  nextNumeral,
  nextChapter,
  nextHref,
}: Props) {
  const curlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = curlRef.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      el.style.transform = "rotateX(0deg)";
      el.style.opacity = "1";
      return;
    }

    let rafId = 0;
    const tick = () => {
      const node = curlRef.current;
      if (!node) return;
      // Element-local progress instead of whole-page scroll progress.
      // This lets the curl animate across the endplate's own travel into
      // view, regardless of total page length. Previous version used
      // scrollProgressRef[0.85, 1.0] which on long pages resolved in a
      // tiny window the eye missed entirely.
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when element top is at viewport bottom (just appearing)
      // 1 when element top has scrolled to viewport top (fully arrived)
      const t = Math.max(0, Math.min(1, (vh - rect.top) / vh));
      node.style.transform = "rotateX(" + (-40 * t).toFixed(2) + "deg)";
      node.style.opacity = String(0.35 + 0.65 * t);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="relative min-h-[60vh] flex flex-col items-center justify-center mt-24 overflow-hidden"
      style={{ perspective: "1500px" }}
    >
      <BackgroundCaustic />
      <div
        ref={curlRef}
        className="relative max-w-2xl mx-auto text-center will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "bottom center",
          transform: "rotateX(0deg)",
          opacity: 0.35,
        }}
      >
        <div className="font-serif italic text-sepia text-2xl">❦</div>
        <div className="mt-6 font-serif italic text-mute text-[1.25rem]">
          fin. {numeral} · {chapter}
        </div>
        <div className="mt-10 flex justify-center">
          <Meander className="h-3 w-40 text-sepia/55" />
        </div>
        <div className="mt-10">
          <Link
            href={nextHref}
            className="inline-block font-mono text-[11px] uppercase tracking-[0.28em] text-sepia hover:text-ink transition-colors duration-300"
          >
            → continue to {nextNumeral} · {nextChapter}
          </Link>
        </div>
      </div>
    </div>
  );
}
