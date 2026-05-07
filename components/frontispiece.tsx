"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { HeroFluid } from "@/components/hero-fluid";

/**
 * Frontispiece — single 280vh sticky section that contains the hero AND
 * the dissolve transition out of it. The bust never disappears and
 * reappears: it lives inside the WebGL canvas from frame 0, the same
 * DOM node carries it through the dissolve.
 *
 * Scroll choreography across the 180vh of pin scroll (scrollYProgress
 * 0 → 1):
 *   0.00 → 0.18  Hero state. dissolveProgress = 0. Bust full, name
 *                + italic line + scroll cue visible. Cursor tilts
 *                the bust via shader UV offset.
 *   0.18 → 0.40  Hero text fades, cursor tilt fades.
 *   0.20 → 0.88  dissolveProgress climbs 0 → 1. Per-pixel FBM front
 *                sweeps top-to-bottom; pixels at the front bleed
 *                ink into the dye + drip velocity into the field.
 *   0.93 → 1.00  Canvas fades to black for the iris hand-off in
 *                MuseumTransition.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const dissolveProgress = useTransform(
    scrollYProgress,
    [0.2, 0.88],
    [0, 1],
    { clamp: true },
  );

  const canvasOpacity = useTransform(scrollYProgress, [0.93, 1], [1, 0]);
  const heroFade = useTransform(
    scrollYProgress,
    [0, 0.18, 0.4],
    [1, 1, 0],
  );
  const nameY = useTransform(scrollYProgress, [0, 0.5], ["0%", "-12%"]);

  // Cursor-driven UV tilt on the bust — pointer position offsets bust UV
  // by a tiny amount, faded out by the time the dissolve really kicks in.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rawTiltX = useTransform(mx, [0, 1], [-0.012, 0.012]);
  const rawTiltY = useTransform(my, [0, 1], [0.008, -0.008]);
  const tiltX = useSpring(rawTiltX, { stiffness: 70, damping: 16 });
  const tiltY = useSpring(rawTiltY, { stiffness: 70, damping: 16 });
  const tiltGate = useTransform(scrollYProgress, [0.18, 0.3], [1, 0]);
  const finalTiltX = useTransform(
    [tiltX, tiltGate],
    ([t, g]: number[]) => t * g,
  );
  const finalTiltY = useTransform(
    [tiltY, tiltGate],
    ([t, g]: number[]) => t * g,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "280vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Layer 0 — fluid + bust + dissolve, all in one canvas */}
        <motion.div
          style={{ opacity: canvasOpacity }}
          className="absolute inset-0 z-0"
        >
          <HeroFluid
            dissolveProgress={dissolveProgress}
            bustTiltX={finalTiltX}
            bustTiltY={finalTiltY}
          />
        </motion.div>

        {/* Layer 1 — left wash for name legibility */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: heroFade }}
          className="absolute inset-0 z-[1] pointer-events-none"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(20,17,13,0.72) 0%, rgba(20,17,13,0.45) 28%, rgba(20,17,13,0) 55%)",
            }}
          />
        </motion.div>

        {/* Layer 2 — hero text */}
        <motion.div
          style={{ y: nameY, opacity: heroFade }}
          className="absolute inset-0 z-10 mx-auto grid h-full max-w-[90rem] grid-cols-1 items-center gap-10 px-8 pb-16 pt-32 md:grid-cols-12 md:px-16 pointer-events-none"
        >
          <div className="md:col-span-7 pointer-events-auto">
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
          {/* Right column intentionally empty — bust lives in the canvas */}
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
