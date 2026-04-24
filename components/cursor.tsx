"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Contextual italic cursor.
 * 6px ink dot trails the pointer with GSAP quickTo (duration 0.3, power3).
 * When the pointer enters an element with a resolvable cursor context —
 * explicit `data-cursor="WORD"`, a link, or a prose tag — the dot dissolves
 * and a Cormorant italic label fades in at the cursor, trailing with a
 * slower quickTo (duration 0.5) so it lags poetically behind the pointer.
 * Disabled on touch / coarse pointers; OS cursor returns there.
 */

const LINK_SELECTOR = "a, button, [role='button']";
const PROSE_SELECTOR = "p, li, h1, h2, h3, h4, article, blockquote";

/** Walk ancestors; pick the deepest matching context (most specific wins). */
function resolveLabel(target: EventTarget | null): string | null {
  if (!(target instanceof Element)) return null;

  const explicit = target.closest<HTMLElement>("[data-cursor]");
  const link = target.closest<HTMLElement>(LINK_SELECTOR);
  const prose = target.closest<HTMLElement>(PROSE_SELECTOR);

  type C = { el: HTMLElement; label: string };
  const candidates: C[] = [];
  if (explicit) {
    const w = explicit.getAttribute("data-cursor");
    if (w) candidates.push({ el: explicit, label: w });
  }
  if (link) candidates.push({ el: link, label: "Open" });
  if (prose) candidates.push({ el: prose, label: "Read" });

  if (candidates.length === 0) return null;

  // Deepest (most specific) wins — the one not containing any other candidate.
  let best = candidates[0];
  for (const c of candidates.slice(1)) {
    if (best.el.contains(c.el) && best.el !== c.el) best = c;
  }
  return best.label;
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (touch) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const labelEl = labelRef.current;
    if (!dot || !labelEl) return;

    // Start off-screen so the first frame isn't at (0, 0).
    gsap.set([dot, labelEl], { x: -9999, y: -9999 });

    const dx = gsap.quickTo(dot, "x", { duration: 0.3, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.3, ease: "power3" });
    const lx = gsap.quickTo(labelEl, "x", { duration: 0.5, ease: "power3" });
    const ly = gsap.quickTo(labelEl, "y", { duration: 0.5, ease: "power3" });

    const onMove = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      lx(e.clientX);
      ly(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      setLabel(resolveLabel(e.target));
    };

    const onDocLeave = () => setLabel(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseleave", onDocLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseleave", onDocLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const dotVisible = !label;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] h-1.5 w-1.5 rounded-full bg-ink"
        style={{
          opacity: dotVisible ? 1 : 0,
          scale: dotVisible ? 1 : 0,
          transition: "opacity 180ms ease-out, scale 180ms ease-out",
          willChange: "transform",
        }}
      />
      <div
        ref={labelRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] font-serif italic text-[1.15rem] leading-none text-ink"
        style={{
          opacity: label ? 1 : 0,
          transition: "opacity 180ms ease-out",
          willChange: "transform",
          paddingLeft: "14px",
          paddingTop: "4px",
        }}
      >
        {label}
      </div>
    </>
  );
}
