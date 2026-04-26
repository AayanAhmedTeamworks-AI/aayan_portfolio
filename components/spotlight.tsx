"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Tungsten spotlight that follows the pointer. Composes with <Cursor />:
 * spotlight is the light source, the cursor is the precise indicator. The
 * radial gradient screen-blends with the warm-black canvas, brightening
 * whatever the pointer passes over the way a museum spot-lamp would.
 *
 * Perf: GSAP quickTo for smoothed transform writes, no React state per
 * pointer event. Touch + reduced-motion guards return null.
 */

const SIZE = 460;

export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (touch || reduce) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { x: -9999, y: -9999, opacity: 0, scale: 1 });
    const sx = gsap.quickTo(el, "x", { duration: 0.38, ease: "power3" });
    const sy = gsap.quickTo(el, "y", { duration: 0.38, ease: "power3" });

    let firstMove = true;
    const half = SIZE / 2;

    const onMove = (e: PointerEvent) => {
      sx(e.clientX - half);
      sy(e.clientY - half);
      if (firstMove) {
        firstMove = false;
        gsap.to(el, { opacity: 1, duration: 0.6, ease: "power2.out" });
      }
    };

    const onLeave = () => {
      gsap.to(el, { opacity: 0, duration: 0.5, ease: "power2.out" });
      firstMove = true;
    };

    // Bloom — page-emitted curator-turning-on-the-spotlight beat. Triggered
    // by ClosingPortrait at the bottom of Vita; harmless elsewhere.
    const onBloom = (e: Event) => {
      const detail = (e as CustomEvent<{
        duration?: number;
        scale?: number;
      }>).detail;
      const dur = (detail?.duration ?? 900) / 1000;
      const peak = detail?.scale ?? 1.5;
      gsap.killTweensOf(el, "scale");
      gsap.to(el, {
        scale: peak,
        duration: dur * 0.45,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(el, {
            scale: 1,
            duration: dur * 0.55,
            ease: "power2.inOut",
          });
        },
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("spotlight:bloom", onBloom);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("spotlight:bloom", onBloom);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30"
      style={{
        width: SIZE,
        height: SIZE,
        background:
          "radial-gradient(circle, rgba(232, 192, 138, 0.34) 0%, rgba(201, 163, 114, 0.20) 22%, rgba(180, 142, 90, 0.09) 45%, transparent 72%)",
        mixBlendMode: "screen",
        willChange: "transform, opacity",
      }}
    />
  );
}
