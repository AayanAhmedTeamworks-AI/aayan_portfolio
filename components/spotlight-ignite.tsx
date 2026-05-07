"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Spotlight ignite — transition into the Lab section. The museum has gone
 * dark; the curator turns on the spot above the lab table.
 *
 * 180vh sticky section. Across the pin scroll:
 *   0.00 → 0.30   Page goes dark — black overlay fades in over the
 *                  warm-black canvas. The room is silent.
 *   0.30 → 0.60   The spotlight ignites. Warm-tungsten radial gradient
 *                  blooms from a tiny point at centre, scales up to fill
 *                  the room, brightness peaks.
 *   0.55 → 0.78   "v · The lab." emerges inside the bloom — italic
 *                  numeral above the title, the same chapter-cover
 *                  register as the rest of the page.
 *   0.78 → 1.00   Spotlight settles down to ambient warmth and the
 *                  text fades; the next section (Lab) follows in
 *                  natural scroll.
 *
 * Replaces the previous SectionIntro for Lab — same chapter framing,
 * carried by the spotlight gesture instead of a quiet typographic
 * mask reveal.
 */
export function SpotlightIgnite() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Page goes black — overlay fades in over the warm canvas
  const blackOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.85, 1],
    [0, 1, 1, 0.7],
  );

  // Spotlight scale + opacity. Starts as a tiny ember, blooms to room-
  // filling, peaks bright, then settles.
  const spotlightScale = useTransform(
    scrollYProgress,
    [0.3, 0.6, 0.85, 1],
    [0.04, 1.0, 1.4, 1.6],
  );
  const spotlightOpacity = useTransform(
    scrollYProgress,
    [0.28, 0.55, 0.78, 1],
    [0, 1, 0.85, 0.4],
  );

  // Title text emerges inside the bloom, fades as we exit
  const textOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.66, 0.82, 0.96],
    [0, 1, 1, 0],
  );
  const textY = useTransform(scrollYProgress, [0.5, 0.7], [22, 0]);
  const numeralOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.65, 0.82, 0.96],
    [0, 1, 1, 0],
  );

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "180vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Layer 0 — black overlay deepens the canvas as the room dims */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: blackOpacity }}
          className="absolute inset-0 z-0"
          // very dark warm — slightly darker than the canvas so the
          // dimming is felt even on the already-dark background
          // (#0a0805)
        >
          <div className="absolute inset-0 bg-[#0a0805]" />
        </motion.div>

        {/* Layer 1 — warm-tungsten spotlight, blooms from a single point */}
        <motion.div
          aria-hidden="true"
          style={{ scale: spotlightScale, opacity: spotlightOpacity }}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <div
            className="aspect-square w-[120vmin]"
            style={{
              background:
                "radial-gradient(circle, " +
                "rgba(255, 205, 145, 0.95) 0%, " +
                "rgba(240, 188, 122, 0.78) 8%, " +
                "rgba(220, 168, 100, 0.55) 18%, " +
                "rgba(180, 138, 80, 0.30) 32%, " +
                "rgba(139, 107, 63, 0.12) 50%, " +
                "rgba(100, 78, 48, 0.04) 68%, " +
                "transparent 82%)",
            }}
          />
        </motion.div>

        {/* Layer 2 — chapter title within the bloom */}
        <motion.div
          style={{ y: textY, opacity: textOpacity }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none px-8"
        >
          <motion.p
            style={{ opacity: numeralOpacity }}
            className="font-serif italic text-sepia/90 text-[clamp(7rem,18vw,16rem)] leading-[0.85] tracking-[-0.04em] mb-2"
          >
            v.
          </motion.p>
          <h2 className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.92] tracking-[-0.04em] text-ink text-center">
            The lab<span className="italic text-sepia/95">.</span>
          </h2>
          <p className="mt-8 max-w-[44ch] font-serif italic text-mute text-base md:text-lg text-center">
            Things you can play with. No API keys, no telemetry &mdash; the
            demos run in your browser.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
