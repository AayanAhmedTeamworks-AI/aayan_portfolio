"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees at the corners. */
  max?: number;
  /** Per-frame easing factor toward the cursor target. */
  ease?: number;
};

/**
 * Pointer-tracked 3D tilt wrapper. Wraps any content; on hover, the
 * wrapped element tilts toward the cursor along X and Y axes via inline
 * transform updates inside a damped rAF loop.
 *
 * No React re-renders — all animation is imperative DOM. Stops the rAF
 * loop once the tilt has settled below a small epsilon to avoid burning
 * the main thread when nothing is moving. Disabled on coarse pointers
 * (no benefit on touch).
 */
export function TiltCard({ children, className, max = 7, ease = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) return;
    const node = ref.current;
    if (!node) return;

    let raf = 0;
    let active = false;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const loop = () => {
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      const el = ref.current;
      if (el) {
        el.style.transform =
          "perspective(1200px) rotateX(" +
          cx.toFixed(2) +
          "deg) rotateY(" +
          cy.toFixed(2) +
          "deg)";
      }
      const settled =
        Math.abs(tx - cx) < 0.02 && Math.abs(ty - cy) < 0.02;
      if (settled && tx === 0 && ty === 0) {
        active = false;
        if (el) {
          el.style.transform =
            "perspective(1200px) rotateX(0deg) rotateY(0deg)";
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      // Top of card → pitch forward (negative rotateX); right of card →
      // yaw right (positive rotateY).
      tx = -py * max * 2;
      ty = px * max * 2;
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
    };
  }, [max, ease]);

  return (
    <div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
