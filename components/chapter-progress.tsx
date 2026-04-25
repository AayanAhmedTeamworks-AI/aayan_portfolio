"use client";

import { useEffect, useMemo, useRef } from "react";
import { scrollProgressRef } from "@/lib/scroll-progress";

const CELLS = 80;
const CELL_W = 14;
const CELL_H = 12;

/**
 * Build a continuous Greek-key meander path made of `CELLS` repeating
 * units of width 14 and height 12. The path is a single contiguous line
 * so `getTotalLength()` covers the full ornament — letting us drive a
 * left-to-right reveal via `strokeDashoffset`.
 */
function buildMeanderPath(): string {
  let d = "M 0 1 L 0 11 L 4 11 L 4 3 L 8 3 L 8 9 L 6 9 L 6 5 L 10 5 L 10 11 L 14 11 L 14 1";
  for (let i = 1; i < CELLS; i++) {
    const x = i * CELL_W;
    d +=
      ` L ${x} 11` +
      ` L ${x + 4} 11` +
      ` L ${x + 4} 3` +
      ` L ${x + 8} 3` +
      ` L ${x + 8} 9` +
      ` L ${x + 6} 9` +
      ` L ${x + 6} 5` +
      ` L ${x + 10} 5` +
      ` L ${x + 10} 11` +
      ` L ${(i + 1) * CELL_W} 11` +
      ` L ${(i + 1) * CELL_W} 1`;
  }
  return d;
}

/**
 * Fixed top-of-viewport meander stripe that fills as the reader
 * scrolls through a chapter. Reads from `scrollProgressRef` (written
 * by Lenis) inside a single rAF loop — never calls setState per frame.
 */
export function ChapterProgress() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const d = useMemo(buildMeanderPath, []);
  const viewBoxW = CELLS * CELL_W;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    let raf = 0;
    const tick = () => {
      const p = scrollProgressRef.current;
      // Clamp defensively so any rogue value still produces a valid offset.
      const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
      path.style.strokeDashoffset = String(length * (1 - clamped));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[35] pointer-events-none text-sepia/40"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${viewBoxW} ${CELL_H}`}
        preserveAspectRatio="none"
        className="block h-full w-full"
      >
        <path
          ref={pathRef}
          d={d}
          stroke="currentColor"
          strokeWidth={0.7}
          fill="none"
        />
      </svg>
    </div>
  );
}
