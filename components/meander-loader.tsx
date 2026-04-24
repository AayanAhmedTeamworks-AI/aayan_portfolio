"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

/**
 * Greek-key (meander) loading bar. Hooks into three.js DefaultLoadingManager
 * via drei's useProgress. Path's stroke-dashoffset animates from full length
 * to 0 as assets load. Minimum visible duration is enforced so the ceremony
 * still happens on a warm cache. No spinner, no percentage. The meander is
 * the loader.
 */

const MIN_DURATION_MS = 1200;
const FADE_MS = 400;
const CELLS = 60;

/** Concatenate the classic 14×12 meander unit into one continuous path. */
function makeMeanderPath(cells: number): string {
  let d =
    "M 0 1 L 0 11 L 4 11 L 4 3 L 8 3 L 8 9 L 6 9 L 6 5 L 10 5 L 10 11 L 14 11 L 14 1";
  for (let i = 1; i < cells; i++) {
    const x = i * 14;
    d += ` L ${x} 11 L ${x + 4} 11 L ${x + 4} 3 L ${x + 8} 3 L ${x + 8} 9 L ${x + 6} 9 L ${x + 6} 5 L ${x + 10} 5 L ${x + 10} 11 L ${x + 14} 11 L ${x + 14} 1`;
  }
  return d;
}

const PATH = makeMeanderPath(CELLS);
const VIEWBOX_W = CELLS * 14;

export function MeanderLoader() {
  const { progress } = useProgress();
  const [state, setState] = useState<"loading" | "fadeout" | "hidden">(
    "loading",
  );
  const mountedAt = useRef<number>(0);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<number>(progress);
  const lastShown = useRef<number>(0);
  progressRef.current = progress;

  useEffect(() => {
    mountedAt.current = Date.now();
    const pathEl = pathRef.current;
    if (!pathEl) return;
    const pathLength = pathEl.getTotalLength();
    pathEl.style.strokeDasharray = String(pathLength);
    pathEl.style.strokeDashoffset = String(pathLength);

    let raf = 0;
    const tick = () => {
      const elapsed = (Date.now() - mountedAt.current) / MIN_DURATION_MS;
      const real = progressRef.current / 100;
      // Bar fills at min(real, elapsed) — guarantees the 1.2s ceremony without
      // ever outrunning actual load progress. Kept monotonic so a late-arriving
      // real-progress update can't snap the bar backward.
      const raw = real > 0 ? Math.min(elapsed, real) : elapsed;
      const p = Math.max(lastShown.current, Math.min(1, raw));
      lastShown.current = p;

      pathEl.style.strokeDashoffset = String(pathLength * (1 - p));

      if (p >= 1 && real >= 1) {
        setState("fadeout");
        setTimeout(() => setState("hidden"), FADE_MS + 40);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-canvas"
      style={{
        opacity: state === "fadeout" ? 0 : 1,
        pointerEvents: state === "fadeout" ? "none" : "auto",
        transition: `opacity ${FADE_MS}ms ease-out`,
      }}
      role="status"
      aria-label="Loading"
      aria-busy={state === "loading"}
    >
      <div className="w-[min(76vw,60rem)] px-8">
        <svg
          viewBox={`0 0 ${VIEWBOX_W} 12`}
          preserveAspectRatio="none"
          className="block h-4 w-full text-sepia/85"
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            d={PATH}
            stroke="currentColor"
            strokeWidth={0.7}
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
