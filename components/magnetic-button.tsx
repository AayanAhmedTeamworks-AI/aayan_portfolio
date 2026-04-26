"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum pull in pixels at the corners. Default 14. */
  pull?: number;
  /** Per-frame easing factor toward the target. Default 0.18. */
  ease?: number;
};

/**
 * Magnetic button wrapper. On pointer-enter into the wrapper's bounding
 * box, the wrapped element follows the cursor with a damped pull —
 * the pointer doesn't have to be exactly on the inner element to drag
 * it; entering the wrapper's hit area is enough.
 *
 * Imperative inline-transform updates, rAF-throttled, auto-stops below
 * an epsilon. Disabled on coarse pointers.
 */
export function MagneticButton({
  children,
  className,
  pull = 14,
  ease = 0.18,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) return;
    const node = ref.current;
    if (!node) return;
    const child = node.firstElementChild as HTMLElement | null;
    if (!child) return;

    let raf = 0;
    let active = false;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const loop = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      child.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      const settled = Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05;
      if (settled && tx === 0 && ty === 0) {
        active = false;
        child.style.transform = "translate3d(0, 0, 0)";
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tx = px * pull * 2;
      ty = py * pull * 2;
      if (!active) {
        active = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!active) {
        active = true;
        raf = requestAnimationFrame(loop);
      }
    };

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);

    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      child.style.transform = "";
    };
  }, [pull, ease]);

  return (
    <div ref={ref} className={cn("inline-block", className)}>
      {children}
    </div>
  );
}
