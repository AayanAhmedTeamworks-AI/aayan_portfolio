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
 * Frontispiece — combined hero + cinematic camera-zoom transition. The
 * camera dollies *into* the right eye of the bust. To sell the dolly:
 *
 *   - The bust's INNER container (the 440×587 photo) is what carries
 *     the scale transform, with transform-origin locked at the eye.
 *     The outer container only translates the bust between hero
 *     position and centred-on-viewport.
 *   - Background layers (fluid, wash) scale alongside the bust, slower,
 *     so the entire scene feels like it's moving past the camera —
 *     not just the bust inflating against a static black void.
 *   - A vignette closes in as the dolly advances.
 *   - The curtain ellipse opens from the eye position at peak growth.
 *
 * No hair-flow filter. The dolly + scale + parallax do the heavy lifting.
 */
export function Frontispiece() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Hero content fade
  const heroFade = useTransform(scrollYProgress, [0, 0.22, 0.36], [1, 1, 0]);
  const nameY = useTransform(scrollYProgress, [0, 0.4], ["0%", "-18%"]);

  // Bust trajectory.
  // Outer translates: hero "26vw, 0" → "1vw, 9vh" so the eye lands at
  // viewport centre.
  // Inner scales: 1 → 7 with transform-origin at (45%, 33%) — the eye.
  const bustOuterX = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["26vw", "26vw", "1vw"],
  );
  const bustOuterY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["0vh", "0vh", "9vh"],
  );
  const bustOpacity = useTransform(
    scrollYProgress,
    [0, 0.56, 0.66],
    [1, 1, 0],
  );
  const bustScale = useTransform(scrollYProgress, [0, 0.25, 0.62], [1, 1, 7]);
  const bustRotate = useTransform(
    scrollYProgress,
    [0.25, 0.32, 0.4, 0.48, 0.56, 0.62],
    [0, 1.0, -0.9, 0.7, -0.5, 0],
  );

  // Background dolly — fluid + wash scale up alongside the bust, slower
  // (1 → 2.4 vs bust's 1 → 7), with origin at the eye's *peak* position
  // (viewport centre). They look like the camera is pushing through them.
  const bgScale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    [1, 1, 2.4],
  );
  // Origin shifts from (75%, 41%) at hero (where the eye starts) toward
  // (50%, 50%) at peak (where the eye ends), so the dolly origin tracks
  // the eye even as it crosses the screen.
  const bgOriginX = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["75%", "75%", "50%"],
  );
  const bgOriginY = useTransform(
    scrollYProgress,
    [0, 0.25, 0.6],
    ["41%", "41%", "50%"],
  );
  const bgOrigin = useTransform(
    [bgOriginX, bgOriginY],
    ([x, y]: string[]) => `${x} ${y}`,
  );

  // Vignette closes in as we advance, fades as curtain takes over
  const vignetteOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.55, 0.66],
    [0, 0.55, 0],
  );

  // Curtain — opens from where the eye lands (viewport centre)
  const curtainClip = useTransform(
    scrollYProgress,
    [0.6, 0.86],
    [
      "ellipse(0% 0% at 50% 50%)",
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

  // Cursor 3D tilt on bust — hero state only
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rawRotateY = useTransform(mx, [0, 1], [8, -8]);
  const rawRotateX = useTransform(my, [0, 1], [-5, 5]);
  const rotateYRaw = useSpring(rawRotateY, { stiffness: 80, damping: 18 });
  const rotateXRaw = useSpring(rawRotateX, { stiffness: 80, damping: 18 });
  const tiltScale = useTransform(scrollYProgress, [0.18, 0.28], [1, 0]);
  const innerRotateX = useTransform(
    [rotateXRaw, tiltScale],
    ([r, t]: number[]) => r * t,
  );
  const innerRotateY = useTransform(
    [rotateYRaw, tiltScale],
    ([r, t]: number[]) => r * t,
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
      style={{ height: "440vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Layer -1 — Berlin photo, behind everything, revealed by curtain */}
        <motion.div
          style={{ clipPath: curtainClip, opacity: berlinOpacity }}
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

        {/* Layer 0 — fluid backdrop, dollies forward (scales) with camera */}
        <motion.div
          style={{
            opacity: heroFade,
            scale: bgScale,
            transformOrigin: bgOrigin,
          }}
          className="absolute inset-0 z-[5]"
        >
          <HeroFluid />
        </motion.div>

        {/* Layer 1 — left wash, dollies forward too */}
        <motion.div
          aria-hidden="true"
          style={{
            opacity: heroFade,
            scale: bgScale,
            transformOrigin: bgOrigin,
          }}
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
        </motion.div>

        {/* Layer 3 — THE BUST.
            Outer wrapper translates the bust from hero position to
            centred-on-viewport.
            Inner wrapper carries the scale + rotate, with
            transform-origin at the eye (45%, 33%) — so scaling expands
            outward FROM the eye. This is the dolly-into-the-eye. */}
        <motion.div
          style={{
            x: bustOuterX,
            y: bustOuterY,
            opacity: bustOpacity,
          }}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            style={{
              scale: bustScale,
              rotateZ: bustRotate,
              rotateX: innerRotateX,
              rotateY: innerRotateY,
              transformOrigin: "45% 33%",
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

        {/* Layer 4 — vignette closes in as camera advances */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: vignetteOpacity }}
          className="absolute inset-0 z-[25] pointer-events-none"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, transparent 35%, rgba(20,17,13,0.85) 90%)",
            }}
          />
        </motion.div>

        {/* Layer 5 — emerging text */}
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
