"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Hero / frontispiece — bust still on the right, name + Berwyn one-liner on
 * the left. Three cheap effects compose the "this image is alive" feel that
 * the dropped 3D bust used to provide:
 *  - Slow scan-light pass: a thin warm-sepia gradient bar travels across the
 *    bust every ~14s, like a museum spot tracking. Pure CSS keyframes.
 *  - Parallax: bust translates Y at ~0.85x of page scroll, so as you scroll
 *    past it, the bust drifts slightly slower than the surrounding text.
 *  - Caption rise: small mono caption beneath the bust fades up after a beat.
 *
 * No JS pointer interaction here; the global <Cursor/> handles that.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bustY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bustScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const bustOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] w-full overflow-hidden"
      data-cursor="Look"
    >
      <div className="relative z-10 mx-auto grid h-full min-h-[100dvh] max-w-[90rem] grid-cols-1 items-center gap-10 px-8 pb-16 pt-32 md:grid-cols-12 md:px-16 md:pt-32">
        {/* Left — name + line */}
        <div className="md:col-span-6 lg:col-span-7">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
            Codex · MMXXVI · Friedberg / Ingolstadt
          </p>
          <h1 className="font-serif text-[clamp(3.5rem,9.5vw,9rem)] leading-[0.92] tracking-[-0.04em] text-ink">
            Syed Aayan
            <br />
            <span className="italic text-sepia/95">Ahmed.</span>
          </h1>
          <p className="mt-10 max-w-[28ch] font-serif italic text-2xl md:text-[1.75rem] leading-[1.18] tracking-[-0.01em] text-ink/80">
            Engineer of durable AI systems &mdash; making LLMs boring,
            on purpose.
          </p>
          <div className="mt-16 flex items-center gap-4 text-mute">
            <span className="block h-px w-10 bg-sepia/55" />
            <span className="font-mono text-[10px] uppercase tracking-[0.32em]">
              Scroll
            </span>
          </div>
        </div>

        {/* Right — bust still + scan-light + parallax */}
        <motion.div
          style={{ y: bustY, scale: bustScale, opacity: bustOpacity }}
          className="md:col-span-6 lg:col-span-5 self-stretch flex items-center justify-center"
        >
          <div className="relative w-[min(72vw,420px)] md:w-full md:max-w-md aspect-[3/4]">
            {/* Ambient flare behind */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-12"
              style={{
                background:
                  "radial-gradient(ellipse 50% 44% at 50% 50%, rgba(201,163,114,0.16) 0%, rgba(139,107,63,0.05) 42%, transparent 72%)",
              }}
            />
            {/* Bust image with mask + slight contrast */}
            <div className="relative h-full w-full overflow-hidden rounded-lg">
              <Image
                src="/bust.png"
                alt="Sculpted marble portrait"
                fill
                priority
                quality={92}
                sizes="(max-width: 768px) 72vw, 420px"
                className="object-contain"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 60% 70% at 50% 52%, #000 60%, transparent 96%)",
                  maskImage:
                    "radial-gradient(ellipse 60% 70% at 50% 52%, #000 60%, transparent 96%)",
                }}
              />
              {/* Scan-light pass — vertical sepia gradient bar travelling left → right
                  every ~14s. Composited via mix-blend-mode so it brightens marble
                  rather than overlaying as a flat color. */}
              <div className="bust-scanlight pointer-events-none absolute inset-0 mix-blend-screen" />
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .bust-scanlight {
          background: linear-gradient(
            100deg,
            transparent 30%,
            rgba(232, 192, 138, 0.22) 47%,
            rgba(255, 220, 168, 0.32) 50%,
            rgba(232, 192, 138, 0.22) 53%,
            transparent 70%
          );
          background-size: 250% 100%;
          background-repeat: no-repeat;
          background-position: 130% 0;
          animation: bust-scan 14s ease-in-out 1.6s infinite;
        }
        @keyframes bust-scan {
          0% {
            background-position: 130% 0;
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          25% {
            background-position: -30% 0;
            opacity: 0;
          }
          100% {
            background-position: -30% 0;
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .bust-scanlight {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
