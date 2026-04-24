"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Contextual italic cursor.
 *
 *  1. 6px ink dot trails the pointer (GSAP quickTo, 0.28s power3).
 *  2. Over a `data-cursor="WORD"` surface (or a link / prose fallback),
 *     the dot dissolves and a Cormorant italic label fades in, trailing
 *     at 0.5s so it lags poetically behind.
 *  3. If the cursor holds still > 900ms over a surface that also carries
 *     `data-cursor-ref="REF"`, a small-caps catalogue line fades in
 *     beneath the primary label. Any motion erases it.
 *
 * Perf discipline: every pointer-driven update is rAF-throttled. Regardless
 * of mouse polling rate (500Hz+ on gaming mice), we run GSAP setters,
 * closest() walks, and React state updates at most once per display frame.
 * Redundant setState calls are filtered by comparing against a closure-
 * scoped mirror of the last resolved value.
 *
 * Disabled on touch / coarse pointers; OS cursor returns there.
 */

const LINK_SELECTOR = "a, button, [role='button']";
const PROSE_SELECTOR = "p, li, h1, h2, h3, h4, article, blockquote";
const DWELL_MS = 900;

function resolveLabel(target: Element | null): string | null {
  if (!target) return null;

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

  let best = candidates[0];
  for (const c of candidates.slice(1)) {
    if (best.el.contains(c.el) && best.el !== c.el) best = c;
  }
  return best.label;
}

function resolveRef(target: Element | null): string | null {
  if (!target) return null;
  const carrier = target.closest<HTMLElement>("[data-cursor-ref]");
  return carrier?.getAttribute("data-cursor-ref") || null;
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const refLabelRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [refLabel, setRefLabel] = useState<string | null>(null);
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
    const refEl = refLabelRef.current;
    if (!dot || !labelEl || !refEl) return;

    gsap.set([dot, labelEl, refEl], { x: -9999, y: -9999 });

    const dx = gsap.quickTo(dot, "x", { duration: 0.28, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.28, ease: "power3" });
    const lx = gsap.quickTo(labelEl, "x", { duration: 0.5, ease: "power3" });
    const ly = gsap.quickTo(labelEl, "y", { duration: 0.5, ease: "power3" });
    const rx = gsap.quickTo(refEl, "x", { duration: 0.65, ease: "power3" });
    const ry = gsap.quickTo(refEl, "y", { duration: 0.65, ease: "power3" });

    let rafPending = false;
    let px = -9999;
    let py = -9999;
    let pTarget: Element | null = null;
    // Closure-scoped mirrors of the React state so we can dedup before
    // calling setState. Avoids triggering reconcile churn at pointer rate.
    let lastLabel: string | null = null;
    let lastRefLabel: string | null = null;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;

    const clearDwell = () => {
      if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const scheduleDwell = () => {
      clearDwell();
      dwellTimer = setTimeout(() => {
        const ref = resolveRef(pTarget);
        const primary = resolveLabel(pTarget);
        if (ref && primary && ref !== lastRefLabel) {
          lastRefLabel = ref;
          setRefLabel(ref);
        }
      }, DWELL_MS);
    };

    const flush = () => {
      rafPending = false;

      // Positions — six GSAP setters once per frame regardless of Hz.
      dx(px);
      dy(py);
      lx(px);
      ly(py);
      rx(px);
      ry(py);

      // Primary label — skip setState if resolved value hasn't changed.
      const resolved = resolveLabel(pTarget);
      if (resolved !== lastLabel) {
        lastLabel = resolved;
        setLabel(resolved);
      }

      // Any pointer motion erases the catalogue line. Only setState when
      // actually clearing a non-null value.
      if (lastRefLabel !== null) {
        lastRefLabel = null;
        setRefLabel(null);
      }
      scheduleDwell();
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      pTarget = e.target as Element;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(flush);
      }
    };

    const onDocLeave = () => {
      if (lastLabel !== null) {
        lastLabel = null;
        setLabel(null);
      }
      if (lastRefLabel !== null) {
        lastRefLabel = null;
        setRefLabel(null);
      }
      clearDwell();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onDocLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onDocLeave);
      clearDwell();
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
      <div
        ref={refLabelRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[80] font-mono text-[9px] uppercase leading-none tracking-[0.28em] text-ink/55"
        style={{
          opacity: refLabel ? 1 : 0,
          transition: "opacity 240ms ease-out",
          willChange: "transform",
          paddingLeft: "14px",
          paddingTop: "30px",
        }}
      >
        {refLabel}
      </div>
    </>
  );
}
