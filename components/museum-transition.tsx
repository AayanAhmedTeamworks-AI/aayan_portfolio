"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * MuseumTransition — bridge between the hero and Vita. Elliptical curtain
 * opens onto the Berlin photo, "My name is Syed Aayan Ahmed." emerges
 * from below.
 *
 * Two acts inside one sticky-pinned 100vh of pin scroll (180vh outer):
 *
 *   I. Curtain opens (10 → 65%). An elliptical clip-path expands from a
 *      tight low arch to full bleed, revealing the Berlin photo
 *      underneath. The theatrical iris.
 *  II. Text emerges (70 → 95%). "My name is Syed Aayan Ahmed." fades up
 *      from below the photo.
 */
export function MuseumTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const curtainClip = useTransform(
    scrollYProgress,
    [0.1, 0.65],
    [
      "ellipse(0% 0% at 50% 50%)",
      "ellipse(120% 130% at 50% 50%)",
    ],
  );
  const berlinScale = useTransform(scrollYProgress, [0.1, 1], [1.18, 1]);
  const berlinOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.25],
    [0, 1],
  );

  const textOpacity = useTransform(scrollYProgress, [0.7, 0.92], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.7, 1], [50, 0]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "180vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        {/* Berlin photo, revealed by the elliptical curtain */}
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

        {/* Emerging text */}
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
