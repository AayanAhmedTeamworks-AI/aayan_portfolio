"use client";

import { useEffect, useState } from "react";

/**
 * Cursor prelude — a faint Roman-numeral ghost of the destination chapter.
 *
 * Sibling to <Cursor />. Listens at the document level for pointer motion,
 * arms a 600ms dwell timer, and on dwell-out reads `data-cursor-destination`
 * from the closest ancestor element. The numeral fades in at 8% opacity at
 * the right edge of the viewport. Any motion off the link, or the pointer
 * leaving the document entirely, clears it.
 *
 * Perf discipline: pointermove never sets React state directly. A closure
 * ref tracks the current destination so setState only fires on actual
 * transitions (null → "II", "II" → null). The dwell timer is a single
 * setTimeout reset on every move.
 *
 * Disabled on touch / coarse pointers.
 */

const DWELL_MS = 600;
const DESTINATION_ATTR = "data-cursor-destination";
const DESTINATION_SELECTOR = "[data-cursor-destination]";

export function CursorPrelude(): React.ReactElement | null {
  const [enabled, setEnabled] = useState(false);
  const [dest, setDest] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (touch) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let lastTarget: Element | null = null;
    // Closure mirror of the React state — read on every pointermove without
    // forcing a re-render. setState only fires on real transitions below.
    let currentDest: string | null = null;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDwell = () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const resolveDestination = (target: Element | null): string | null => {
      if (!target) return null;
      const carrier = target.closest<HTMLElement>(DESTINATION_SELECTOR);
      if (!carrier) return null;
      const value = carrier.getAttribute(DESTINATION_ATTR);
      return value && value.length > 0 ? value : null;
    };

    const onMove = (e: PointerEvent) => {
      lastTarget = e.target as Element;

      // If a numeral is currently showing and the pointer moved off the
      // carrier (or onto a different one), erase immediately.
      if (currentDest !== null) {
        const resolved = resolveDestination(lastTarget);
        if (resolved !== currentDest) {
          currentDest = null;
          setDest(null);
        }
      }

      // Always reset the dwell timer on motion.
      clearDwell();
      dwellTimer = setTimeout(() => {
        const resolved = resolveDestination(lastTarget);
        if (resolved && resolved !== currentDest) {
          currentDest = resolved;
          setDest(resolved);
        }
      }, DWELL_MS);
    };

    const onDocLeave = () => {
      clearDwell();
      if (currentDest !== null) {
        currentDest = null;
        setDest(null);
      }
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onDocLeave);
    document.addEventListener("mouseleave", onDocLeave);

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onDocLeave);
      document.removeEventListener("mouseleave", onDocLeave);
      clearDwell();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed right-[6vw] top-1/2 -translate-y-1/2 z-[30] font-serif italic text-sepia pointer-events-none select-none leading-none"
      style={{
        fontSize: "clamp(6rem, 14vw, 14rem)",
        letterSpacing: "-0.05em",
        opacity: dest ? 0.08 : 0,
        transition: "opacity 360ms ease-out",
      }}
    >
      {dest ?? ""}
    </div>
  );
}
