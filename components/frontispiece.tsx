"use client";

import Image from "next/image";
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
 * Frontispiece — combined hero + cinematic transition. ONE sticky section
 * spanning ~440vh, with a single bust DOM element that morphs across
 * four scroll-driven acts:
 *
 *   I.  Hero (0 → 25%) — name on the left, bust on the right, golden
 *       ink fluid behind. The Caravaggio.
 *   II. Bust grows (25 → 60%) — name + ink fade out, bust scales from
 *       1× to 7×, drifts from its right-column position to centre,
 *       wobbles (rotateZ ±2.4°, skewX ±2.5°) to suggest the hair flowing
 *       and the marble surging closer to the camera.
 *   III. Curtain opens (60 → 86%) — bust dissolves; an elliptical
 *        clip-path opens on the Berlin photo behind, theatrical curved
 *        iris reveal. Camera passes through the marble onto the man.
 *   IV. Text emerges (86 → 100%) — "My name is Syed Aayan Ahmed."
 *       fades up from below the photo.
 *
 * The bust is the through-line. It is the same image element from start
 * to finish; the camera moves, the figure stays.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Hero content fades out 25-40%
  const heroFade = useTransform(scrollYProgress, [0, 0.25, 0.4], [1, 1, 0]);
  const nameY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-18%"]);

  // Bust — single element, one trajectory
  // Hero state: scale 1, x = right-column offset (~26vw from centre), rotate 0
  // Growth state: scales to 7×, drifts to centre x=0
  // Fade state: opacity drops to 0 around 56-66%
  const bustScale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.62],
    [1, 1, 7],
  );
  const bustX = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["26vw", "26vw", "0vw"],
  );
  const bustY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["0vh", "0vh", "0vh"],
  );
  const bustOpacity = useTransform(
    scrollYProgress,
    [0, 0.55, 0.66],
    [1, 1, 0],
  );
  // Hair-flow suggestion — rotation + skew oscillation during growth phase
  const bustRotate = useTransform(
    scrollYProgress,
    [0.25, 0.32, 0.4, 0.48, 0.56, 0.62],
    [0, 2.2, -2.0, 1.6, -1.2, 0],
  );
  const bustSkewX = useTransform(
    scrollYProgress,
    [0.25, 0.34, 0.44, 0.54, 0.62],
    [0, -2.5, 2.2, -1.4, 0],
  );

  // Curtain on the Berlin photo
  const curtainClip = useTransform(
    scrollYProgress,
    [0.6, 0.86],
    [
      "ellipse(0% 0% at 50% 60%)",
      "ellipse(120% 130% at 50% 50%)",
    ],
  );
  const berlinScale = useTransform(scrollYProgress, [0.6, 1], [1.18, 1]);
  const berlinOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.7],
    [0, 1],
  );

  // Emerging text
  const textOpacity = useTransform(scrollYProgress, [0.86, 0.96], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.86, 1], [50, 0]);

  // Cursor-driven 3D tilt on the bust (hero state only)
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rawRotateY = useTransform(mx, [0, 1], [8, -8]);
  const rawRotateX = useTransform(my, [0, 1], [-5, 5]);
  const rotateY = useSpring(rawRotateY, { stiffness: 80, damping: 18 });
  const rotateX = useSpring(rawRotateX, { stiffness: 80, damping: 18 });
  // Tilt fades out as the bust starts growing (rotateX/Y get strange at scale 7)
  const tiltScale = useTransform(scrollYProgress, [0.2, 0.3], [1, 0]);

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
      style={{ height: "440vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Layer -1 — Berlin photo, behind everything, revealed by curtain */}
        <motion.div
          style={{
            clipPath: curtainClip,
            opacity: berlinOpacity,
          }}
          className="absolute inset-0 z-0"
        >
          <motion.div
            style={{ scale: berlinScale }}
            className="absolute inset-0"
          >
            <Image
              src="/portrait-berlin.jpg"
              alt=""
              fill
              sizes="100vw"
              quality={92}
              priority
              className="object-cover grayscale-[6%] contrast-[1.02]"
            />
            <div className="absolute inset-0 bg-canvas/30" />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, transparent 50%, rgba(20,17,13,0.55) 100%)",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Layer 0 — fluid backdrop (visible only in hero state) */}
        <motion.div
          style={{ opacity: heroFade }}
          className="absolute inset-0 z-[5]"
        >
          <HeroFluid />
        </motion.div>

        {/* Layer 1 — soft canvas wash on left third for name legibility,
            fades with hero content */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: heroFade }}
          className="absolute inset-0 z-[6] pointer-events-none"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(20,17,13,0.72) 0%, rgba(20,17,13,0.45) 28%, rgba(20,17,13,0) 55%)",
            }}
          />
        </motion.div>

        {/* Layer 2 — hero text (name, italic line, scroll cue) */}
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
        </motion.div>

        {/* Layer 3 — THE BUST. One DOM element. Single trajectory across
            the entire 440vh scroll. Centred origin, transforms move it
            from right-column hero position to centred viewport-engulfing
            scale, then it fades. */}
        <motion.div
          style={{
            x: bustX,
            y: bustY,
            scale: bustScale,
            opacity: bustOpacity,
            rotateZ: bustRotate,
            skewX: bustSkewX,
          }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            style={{
              rotateX: useTransform(
                [rotateX, tiltScale],
                ([r, t]: number[]) => r * t,
              ),
              rotateY: useTransform(
                [rotateY, tiltScale],
                ([r, t]: number[]) => r * t,
              ),
              transformPerspective: 1200,
            }}
            className="relative w-[440px] aspect-[3/4]"
          >
            <Image
              src="/bust.png"
              alt="Sculpted marble portrait"
              fill
              priority
              quality={92}
              sizes="440px"
              className="object-contain"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
                maskImage:
                  "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
              }}
            />
          </motion.div>
        </motion.div>

        {/* Layer 4 — emerging text */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-x-0 bottom-[18vh] z-30 flex justify-center px-8 pointer-events-none"
        >
          <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] tracking-[-0.03em] text-ink leading-[1.05] text-center max-w-[22ch]">
            My name is{" "}
            <span className="italic text-sepia/95">Syed Aayan Ahmed.</span>
          </h2>
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
