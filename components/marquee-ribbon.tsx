"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** The phrases to scroll. Each is rendered with a separator between. */
  items: string[];
  className?: string;
  /** Pixels per second. Default 18 — slow, walking-pace. */
  speed?: number;
  /** Whether to pause on hover. Default true. */
  pauseOnHover?: boolean;
};

/**
 * Slow horizontal ribbon of phrases — the kind running across the
 * entablature of a building, or down the spine of a book series. Two
 * copies of the items render side-by-side; the strip is translated by
 * negative X at constant velocity, wrapping seamlessly when the first
 * copy has fully scrolled out.
 *
 * Imperative DOM updates inside a single rAF, no React state per frame.
 * Pure CSS would also work via @keyframes translateX, but JS gives us
 * pause-on-hover and exact px/s control.
 */
export function MarqueeRibbon({
  items,
  className,
  speed = 18,
  pauseOnHover = true,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    let raf = 0;
    let last = performance.now();
    let offset = 0;
    let paused = false;

    // Width of one copy of the items (track holds two copies side by side).
    const halfWidth = () => track.scrollWidth / 2;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!paused) {
        offset += speed * dt;
        const w = halfWidth();
        if (w > 0 && offset >= w) offset -= w;
        track.style.transform = `translate3d(${(-offset).toFixed(2)}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onEnter = () => {
      if (pauseOnHover) paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    if (pauseOnHover) {
      container.addEventListener("pointerenter", onEnter);
      container.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (pauseOnHover) {
        container.removeEventListener("pointerenter", onEnter);
        container.removeEventListener("pointerleave", onLeave);
      }
    };
  }, [speed, pauseOnHover]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden border-y border-hairline bg-canvas",
        className,
      )}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0">
            {items.map((item, i) => (
              <Item key={`${copy}-${i}`}>{item}</Item>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-8 px-8 py-4 font-serif text-[1.25rem] italic text-sepia/80 tracking-tight">
      <span>{children}</span>
      <span className="font-serif text-[1.5rem] not-italic text-sepia/50 leading-none">
        ❦
      </span>
    </span>
  );
}
