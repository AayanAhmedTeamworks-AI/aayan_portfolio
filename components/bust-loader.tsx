"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Loading screen — bust photo centered on the warm-black canvas, small mono
 * caption beneath, fades out once the page is ready (and at minimum 1.2s, so
 * the ceremony actually happens). Skipped on repeat visits via sessionStorage.
 *
 * The bust image is preloaded by the browser via Next/Image priority, so by
 * the time the loader hides, it's warm in the cache for the hero below.
 */

const MIN_MS = 1200;
const MAX_MS = 3000;
const FADE_MS = 700;
const SESSION_KEY = "codex:loaded";

export function BustLoader() {
  const [state, setState] = useState<"checking" | "loading" | "fadeout" | "hidden">(
    "checking",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem(SESSION_KEY)) {
      setState("hidden");
      return;
    }
    setState("loading");

    const mountedAt = Date.now();

    const startFadeout = () => {
      const elapsed = Date.now() - mountedAt;
      const remaining = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(() => {
        setState("fadeout");
        sessionStorage.setItem(SESSION_KEY, "1");
        window.setTimeout(() => setState("hidden"), FADE_MS + 40);
      }, remaining);
    };

    if (document.readyState === "complete") {
      startFadeout();
      return;
    }

    const onReady = () => startFadeout();
    window.addEventListener("load", onReady, { once: true });
    const safety = window.setTimeout(startFadeout, MAX_MS);

    return () => {
      window.removeEventListener("load", onReady);
      window.clearTimeout(safety);
    };
  }, []);

  if (state === "hidden" || state === "checking") return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      aria-busy={state === "loading"}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-canvas"
      style={{
        opacity: state === "fadeout" ? 0 : 1,
        pointerEvents: state === "fadeout" ? "none" : "auto",
        transition: `opacity ${FADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {/* Ambient warm flare behind the bust */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 38% at 50% 48%, rgba(201,163,114,0.16) 0%, rgba(139,107,63,0.05) 40%, transparent 72%)",
        }}
      />
      <div
        className="relative w-[min(72vw,420px)] aspect-[3/4] overflow-hidden rounded-lg"
        style={{
          animation: "bust-loader-rise 1100ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <Image
          src="/bust.png"
          alt=""
          fill
          priority
          quality={92}
          sizes="(max-width: 768px) 72vw, 420px"
          className="object-contain"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse 62% 70% at 50% 52%, #000 60%, transparent 96%)",
            maskImage:
              "radial-gradient(ellipse 62% 70% at 50% 52%, #000 60%, transparent 96%)",
          }}
        />
      </div>
      <p
        className="relative mt-10 font-mono text-[10px] uppercase tracking-[0.36em] text-sepia/80"
        style={{
          animation:
            "bust-loader-rise 1300ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both",
        }}
      >
        Codex Ahmed · MMXXVI
      </p>

      <style jsx>{`
        @keyframes bust-loader-rise {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
