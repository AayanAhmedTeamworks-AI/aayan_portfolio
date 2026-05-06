"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Hero — the page's first impression and load-time set piece.
 *
 * On mount, four things happen in sequence:
 *  1. The mono caption strip drops from above (~600ms)
 *  2. "Syed Aayan" lifts out of a clip-path mask from below (~1.1s, staggered
 *     letter mask)
 *  3. "Ahmed." follows ~250ms behind on the same mask reveal
 *  4. The bust unmasks vertically while a sepia flare blooms behind it
 *  5. The italic Berwyn line and the scroll cue arrive last
 *
 * On scroll, the bust drifts and fades, and a slow scan-light pass repeats
 * across the marble every ~14s — the museum spotlight tracking.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bustY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const bustScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const bustOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100dvh] w-full overflow-hidden"
      data-cursor="Look"
    >
      <div className="relative z-10 mx-auto grid h-full min-h-[100dvh] max-w-[90rem] grid-cols-1 items-center gap-10 px-8 pb-16 pt-32 md:grid-cols-12 md:px-16">
        {/* Left — name + line */}
        <motion.div
          style={{ y: nameY }}
          className="md:col-span-7 lg:col-span-7"
        >
          <motion.p
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-mute"
          >
            Codex · MMXXVI · Friedberg / Ingolstadt
          </motion.p>

          <h1 className="font-serif text-[clamp(3.5rem,10vw,9.5rem)] leading-[0.92] tracking-[-0.045em] text-ink">
            <MaskedReveal delay={0.25}>Syed Aayan</MaskedReveal>
            <br />
            <MaskedReveal delay={0.55} className="italic text-sepia/95">
              Ahmed.
            </MaskedReveal>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 1.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-10 max-w-[28ch] font-serif italic text-2xl md:text-[1.75rem] leading-[1.18] tracking-[-0.01em] text-ink/82"
          >
            Engineer of durable AI systems &mdash; making LLMs boring,
            on purpose.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.95 }}
            className="mt-16 flex items-center gap-4 text-mute"
          >
            <span className="block h-px w-10 bg-sepia/55" />
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5,
              }}
              className="font-mono text-[10px] uppercase tracking-[0.32em]"
            >
              Scroll
            </motion.span>
          </motion.div>
        </motion.div>

        {/* Right — bust still + scan-light + mask reveal + parallax */}
        <motion.div
          style={{ y: bustY, scale: bustScale, opacity: bustOpacity }}
          className="md:col-span-5 lg:col-span-5 self-stretch flex items-center justify-center"
        >
          <div className="relative w-[min(72vw,440px)] md:w-full md:max-w-md aspect-[3/4]">
            {/* Ambient flare blooming on mount */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-12"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.6, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background:
                  "radial-gradient(ellipse 50% 44% at 50% 50%, rgba(201,163,114,0.18) 0%, rgba(139,107,63,0.06) 42%, transparent 72%)",
              }}
            />
            {/* Bust image — clip-path reveal from bottom */}
            <motion.div
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              transition={{
                duration: 1.4,
                delay: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative h-full w-full overflow-hidden rounded-lg"
            >
              <Image
                src="/bust.png"
                alt="Sculpted marble portrait"
                fill
                priority
                quality={92}
                sizes="(max-width: 768px) 72vw, 440px"
                className="object-contain"
                style={{
                  WebkitMaskImage:
                    "radial-gradient(ellipse 60% 70% at 50% 52%, #000 60%, transparent 96%)",
                  maskImage:
                    "radial-gradient(ellipse 60% 70% at 50% 52%, #000 60%, transparent 96%)",
                }}
              />
              <div className="bust-scanlight pointer-events-none absolute inset-0 mix-blend-screen" />
            </motion.div>
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
          animation: bust-scan 14s ease-in-out 2.6s infinite;
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

/** Letter-by-letter clip-path mask reveal. Each letter sits inside its own
 *  clip mask and slides up from below the cap-line. */
function MaskedReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: string;
  delay?: number;
  className?: string;
}) {
  const letters = children.split("");
  return (
    <span className={"inline-block " + className}>
      {letters.map((ch, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden={ch === " "}
          style={{ verticalAlign: "baseline" }}
        >
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{
              duration: 0.95,
              delay: delay + i * 0.04,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block"
          >
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
