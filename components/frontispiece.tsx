"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroFluid } from "@/components/hero-fluid";

/**
 * Hero — bust on the right, name on the left, golden-ink fluid simulation
 * behind everything. The painted backdrop in a Caravaggio: figure carved
 * out of dark ink-stained void by a single light.
 *
 * Phase 2: bust composite. The bust photo sits off-axis right, masked
 * with a radial vignette so its edges fade into the ink rather than
 * reading as a hard rectangle. Subtle scroll-driven settle and parallax;
 * the bust drifts slightly slower than the name as you scroll out.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
  const bustY = useTransform(scrollYProgress, [0, 1], ["0%", "-9%"]);
  const bustScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const bustOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0.5]);
  const fluidOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0.4]);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ height: "120vh" }}
      data-cursor="Look"
    >
      {/* Sticky stage — content + fluid stay in viewport while parent's
          120vh extends past, giving room for scroll-driven fades. */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Layer 0 — fluid backdrop, full-bleed */}
        <motion.div
          style={{ opacity: fluidOpacity }}
          className="absolute inset-0 z-0"
        >
          <HeroFluid />
        </motion.div>

        {/* Layer 1 — soft canvas wash on the left third for legibility of
            the name. Right two-thirds untouched, so the ink reads loud
            there and the bust lands in clean ink. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(20,17,13,0.72) 0%, rgba(20,17,13,0.45) 28%, rgba(20,17,13,0) 55%)",
          }}
        />

        {/* Layer 2 — content. Off-axis right composition: name takes the
            left half, bust sits flush-right inside its column with the
            radial vignette so its edges dissolve into the ink. */}
        <motion.div
          style={{ y: nameY }}
          className="relative z-10 mx-auto grid h-full max-w-[90rem] grid-cols-1 items-center gap-10 px-8 pb-16 pt-32 md:grid-cols-12 md:px-16"
        >
          <div className="md:col-span-7">
            <motion.p
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 font-mono text-[11px] uppercase tracking-[0.28em] text-mute"
            >
              Codex · MMXXVI · Augsburg / Ingolstadt
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
          </div>

          {/* Right column — bust off-axis right, vignette-masked */}
          <motion.div
            style={{ y: bustY, scale: bustScale, opacity: bustOpacity }}
            className="hidden md:col-span-5 md:flex items-center justify-end self-stretch"
          >
            <div className="relative w-full max-w-md aspect-[3/4]">
              {/* Subtle warm glow behind bust — pulls it forward of the ink */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-10"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 44% at 50% 50%, rgba(201,163,114,0.12) 0%, rgba(139,107,63,0.04) 42%, transparent 72%)",
                }}
              />
              {/* Bust — clip-path reveal from below on mount, radial mask
                  so edges dissolve into the ink (Caravaggio framing). */}
              <motion.div
                initial={{ clipPath: "inset(0 0 100% 0)" }}
                animate={{ clipPath: "inset(0 0 0% 0)" }}
                transition={{
                  duration: 1.4,
                  delay: 0.85,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative h-full w-full"
              >
                <Image
                  src="/bust.png"
                  alt="Sculpted marble portrait"
                  fill
                  priority
                  quality={92}
                  sizes="(max-width: 768px) 0px, 440px"
                  className="object-contain"
                  style={{
                    WebkitMaskImage:
                      "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
                    maskImage:
                      "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

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
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
