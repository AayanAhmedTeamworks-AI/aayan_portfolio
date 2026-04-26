"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
  cards: ReactNode[];
  className?: string;
};

/**
 * 3D card stack / slider — cards arrange themselves around the active
 * one in 3D space (the active is centred and flat, neighbours are
 * rotated and pushed back). User navigates with arrow keys, on-card
 * click, or wheel/swipe. Imperative inline-transform updates per
 * card, recomputed only when the active index changes — no per-frame
 * loop, no React reflow on motion.
 *
 * Designed for ~3–6 items; not a list-replacement at scale.
 */
export function CardStack3D({ cards, className }: Props) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const next = useCallback(() => {
    setDirection(1);
    setActive((i) => (i + 1) % cards.length);
  }, [cards.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setActive((i) => (i - 1 + cards.length) % cards.length);
  }, [cards.length]);

  // Apply transforms imperatively to every card whenever active changes.
  useEffect(() => {
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const offset = ((i - active + cards.length) % cards.length);
      // Treat ±1 from the active card as the "shoulder" cards, ±2 as
      // distant. Anything beyond is pushed out of view.
      let normalised = offset;
      if (offset > cards.length / 2) normalised = offset - cards.length;
      const abs = Math.abs(normalised);
      const sign = normalised === 0 ? 0 : normalised > 0 ? 1 : -1;
      const tx = sign * Math.min(abs, 2) * 92; // px outward
      const tz = -Math.min(abs, 3) * 110; // px back
      const ry = sign * Math.min(abs, 2) * 22; // deg
      const opacity = abs > 2 ? 0 : 1 - abs * 0.18;
      const z = 100 - abs;
      el.style.transform =
        "translate3d(" +
        tx.toFixed(0) +
        "px, 0, " +
        tz.toFixed(0) +
        "px) rotateY(" +
        ry.toFixed(2) +
        "deg)";
      el.style.opacity = String(opacity);
      el.style.zIndex = String(z);
      el.style.pointerEvents = abs === 0 ? "auto" : "none";
    });
  }, [active, cards.length]);

  // Wheel & keyboard nav. Wheel uses a debounced flag so the user can scroll
  // through cards but a single rolling gesture doesn't fly through three.
  useEffect(() => {
    let cooldown = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (cooldown) return;
      const dx = e.deltaX;
      const dy = e.deltaY;
      // Use the dominant axis. A horizontal trackpad swipe goes through
      // dx; a vertical wheel goes through dy.
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(delta) < 8) return;
      e.preventDefault();
      cooldown = true;
      setTimeout(() => (cooldown = false), 380);
      if (delta > 0) next();
      else prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div
      className={cn(
        "relative h-[36rem] w-full select-none",
        className,
      )}
      style={{ perspective: "1500px" }}
      role="region"
      aria-label={`Card ${active + 1} of ${cards.length}`}
      aria-roledescription="carousel"
    >
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="absolute h-[28rem] w-[min(30rem,calc(100vw-4rem))] transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{
              transformStyle: "preserve-3d",
              transitionProperty: "transform, opacity",
            }}
            onClick={() => {
              if (i === active) return;
              setDirection(i > active ? 1 : -1);
              setActive(i);
            }}
          >
            {card}
          </div>
        ))}
      </div>

      {/* Controls — sit below the stack, mono small-caps in the codex tone */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-6">
        <button
          type="button"
          onClick={prev}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute hover:text-ink transition-colors duration-300"
          aria-label="Previous card"
        >
          ← prev
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/80">
          {String(active + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={next}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute hover:text-ink transition-colors duration-300"
          aria-label="Next card"
        >
          next →
        </button>
      </div>
    </div>
  );
}
