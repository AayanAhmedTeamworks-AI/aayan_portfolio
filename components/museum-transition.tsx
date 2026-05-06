"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * MuseumTransition — the cinematic bridge between the hero (the bust on
 * the right) and Vita.
 *
 * Three acts, all driven by a single scrollYProgress (0 → 1 across the
 * sticky-pinned section's 100vh of pin scroll):
 *
 *   I.  The bust grows. Starts at its right-column hero position and
 *       scale, scales up to 7×, drifts to centre, with a gentle rotateZ
 *       wobble (the hair-flowing suggestion). At ~50% it begins fading.
 *   II. The curtain. As the bust dissolves, an elliptical clip-path
 *       opens on the Berlin photo behind it — the theatrical curved
 *       opening, an iris from a small arch at centre-low to full bleed.
 *  III. The text. "My name is Syed Aayan Ahmed." emerges word-by-word
 *       from the bottom of the now-revealed photo, the same brightening
 *       treatment that runs through the Vita prose.
 *
 * We zoom into the bust, pass through the marble, emerge on the man.
 */
export function MuseumTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Act I — bust grows, drifts to centre, wobbles, fades
  const bustScale = useTransform(scrollYProgress, [0, 0.55], [1, 7]);
  const bustX = useTransform(scrollYProgress, [0, 0.5], ["28%", "0%"]);
  const bustOpacity = useTransform(
    scrollYProgress,
    [0, 0.42, 0.6],
    [1, 1, 0],
  );
  // Subtle wobble — small rotateZ oscillation tied to scroll progress
  const bustRotate = useTransform(
    scrollYProgress,
    [0, 0.1, 0.22, 0.35, 0.48, 0.55],
    [0, 0.9, -0.8, 0.6, -0.4, 0],
  );
  // Slight skew adds 'flowing' shear to the silhouette as it scales
  const bustSkewX = useTransform(
    scrollYProgress,
    [0, 0.15, 0.3, 0.45, 0.55],
    [0, -1.2, 0.8, -0.5, 0],
  );

  // Act II — theatrical ellipse curtain. Starts as a tight low arch,
  // expands to full bleed.
  const curtainClip = useTransform(
    scrollYProgress,
    [0.5, 0.86],
    [
      "ellipse(0% 0% at 50% 60%)",
      "ellipse(120% 130% at 50% 50%)",
    ],
  );
  const berlinScale = useTransform(scrollYProgress, [0.5, 1], [1.18, 1]);
  const berlinOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6],
    [0, 1],
  );

  // Act III — text emerges
  const textOpacity = useTransform(scrollYProgress, [0.84, 0.95], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.84, 1], [50, 0]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "220vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Layer 0 — Berlin photo, revealed by the elliptical curtain */}
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
            {/* Subtle wash to keep emerging text legible */}
            <div className="absolute inset-0 bg-canvas/30" />
            {/* Vignette around edges of revealed photo */}
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

        {/* Layer 1 — bust, growing and drifting and fading */}
        <motion.div
          style={{
            scale: bustScale,
            x: bustX,
            rotateZ: bustRotate,
            skewX: bustSkewX,
            opacity: bustOpacity,
            transformPerspective: 1400,
          }}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <div className="relative w-[440px] aspect-[3/4]">
            <Image
              src="/bust.png"
              fill
              alt=""
              sizes="440px"
              quality={92}
              priority
              className="object-contain"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
                maskImage:
                  "radial-gradient(ellipse 58% 68% at 50% 52%, #000 58%, transparent 95%)",
              }}
            />
          </div>
        </motion.div>

        {/* Layer 2 — emerging text */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-x-0 bottom-[18vh] z-20 flex justify-center px-8"
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
