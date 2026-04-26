"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** The phrase to repeat across the strip. */
  text: string;
  /** Visible at this opacity. Default 0.06. */
  opacity?: number;
  /** Pixels per second of scroll. Default 22 — slow, ambient. */
  speed?: number;
  /** Outline only (text-stroke), or filled. Default "outline". */
  variant?: "outline" | "filled";
  className?: string;
};

/**
 * Large background marquee — the Patel "kinetic marquee" pattern carried
 * into the codex. Big Cormorant text, outlined or filled at low opacity,
 * scrolling horizontally behind a foreground content layer. Reads as a
 * decorative entablature behind the focal area, not as content.
 *
 * Two copies of the text are rendered side-by-side; the strip translates
 * by negative X at constant velocity, wrapping when the first copy has
 * fully scrolled out. Imperative rAF, no React state.
 *
 * Place inside a `position: relative` parent with `overflow: hidden`.
 * The marquee fills the parent.
 */
export function BackgroundMarquee({
  text,
  opacity = 0.06,
  speed = 22,
  variant = "outline",
  className,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    let last = performance.now();
    let offset = 0;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      offset += speed * dt;
      const w = track.scrollWidth / 2;
      if (w > 0 && offset >= w) offset -= w;
      track.style.transform = `translate3d(${(-offset).toFixed(2)}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  const textStyle: React.CSSProperties =
    variant === "outline"
      ? {
          color: "transparent",
          WebkitTextStroke: "1px var(--color-sepia)",
          opacity,
        }
      : { color: "var(--color-sepia)", opacity };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden flex items-center",
        className,
      )}
      aria-hidden="true"
    >
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform"
      >
        {[0, 1].map((copy) => (
          <span
            key={copy}
            className="font-serif italic shrink-0 leading-none pr-[0.4em]"
            style={{
              ...textStyle,
              fontSize: "clamp(8rem, 22vw, 22rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {text}&nbsp;·&nbsp;
          </span>
        ))}
      </div>
    </div>
  );
}
