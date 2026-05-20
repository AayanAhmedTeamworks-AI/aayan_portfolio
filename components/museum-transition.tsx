"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * MuseumTransition — bridge between the hero and Vita. Elliptical curtain
 * opens onto the Berlin photo, then "My name is Syed Aayan Ahmed." emerges
 * from below.
 *
 * Two acts inside a sticky-pinned 180vh section:
 *
 *   I. Iris opens — viewport-entry-triggered one-shot. As soon as the
 *      section scrolls into view, the elliptical clip-path expands from
 *      0% to 130% over 1.4s, revealing the photo. Decoupled from
 *      scrollYProgress on purpose: previously the photo was gated by both
 *      a scroll-driven clip-path AND a scroll-driven opacity, both
 *      starting at "fully hidden". Users had to scroll deep into the
 *      section before anything appeared, and on touch devices with
 *      smooth-scroll, the scroll-driven values often lagged enough that
 *      the photo never showed. Triggering off viewport entry means the
 *      reveal plays reliably the moment the section is visible.
 *  II. Text emerges (scroll-driven, 0.55 → 0.92). "My name is Syed Aayan
 *      Ahmed." fades up from below. Still scroll-driven because the second
 *      act intentionally rewards continued scrolling.
 */
export function MuseumTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Slight zoom-out on the photo as the user continues scrolling — subtle
  // depth cue, NOT a visibility gate.
  const berlinScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);

  const textOpacity = useTransform(scrollYProgress, [0.55, 0.88], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.55, 1], [50, 0]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "180vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Berlin photo, revealed by the elliptical curtain. The iris
            animates once on viewport entry — `whileInView` with
            `viewport.once`. Initial clipPath fully closed, animated
            value fully open. */}
        <motion.div
          initial={{ clipPath: "ellipse(0% 0% at 50% 50%)" }}
          whileInView={{ clipPath: "ellipse(120% 130% at 50% 50%)" }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
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

        {/* Emerging text — second act, still scroll-driven. */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-x-0 bottom-[18vh] z-20 flex justify-center px-8 pointer-events-none"
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
