"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Meander } from "@/components/meander";
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
      // Guard against the unmount race: cleanup cancels rAF, but a tick
      // already in flight when navigation fires can still run after the
      // ref has been nulled by React.
      const node = curlRef.current;
      if (!node) return;
      const sp = scrollProgressRef.current;
      const t = Math.max(0, Math.min(1, (sp - 0.85) / 0.15));
      node.style.transform = "rotateX(" + (-25 * t).toFixed(2) + "deg)";
      node.style.opacity = String(0.6 + 0.4 * t);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="relative min-h-[60vh] flex flex-col items-center justify-center mt-24"
      style={{ perspective: "1500px" }}
    >
      <div
        ref={curlRef}
        className="max-w-2xl mx-auto text-center will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "bottom center",
          transform: "rotateX(0deg)",
          opacity: 0.6,
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
