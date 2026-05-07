"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BridgeFluid } from "@/components/bridge-fluid";

/**
 * Bridge — the cinematic camera-dolly between hero and MuseumTransition.
 *
 * 200vh sticky section. cameraZ goes 0 → 1 across the pin scroll. The
 * BridgeFluid canvas owns the rendering: bust quad with depth-based
 * parallax displacement + hair turbulence, fluid background sharing the
 * same camera. Pure WebGL2; no DOM transforms on the bust.
 *
 * At cameraZ = 0 the bust framing matches the hero's right-column
 * placement (the hero's CSS bust has just faded). At cameraZ = 1 the
 * pupil sits at viewport centre, ready for the iris reveal opening
 * frame in <MuseumTransition/>.
 */
export function BridgeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // Smooth the progress slightly so cameraZ eases at both ends
  const cameraZ = useTransform(scrollYProgress, [0, 1], [0, 1], {
    clamp: true,
  });

  // Vignette that closes in as the dolly progresses, then opens as we
  // approach the iris hand-off
  const vignetteOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.7, 0.95],
    [0, 0.55, 0.15],
  );

  // Fade out at the very end so the hand-off to MuseumTransition's iris
  // begins on a clean canvas (the iris opens from black).
  const handoffFade = useTransform(
    scrollYProgress,
    [0.92, 1],
    [1, 0],
  );

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "200vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        <motion.div
          style={{ opacity: handoffFade }}
          className="absolute inset-0 z-0"
        >
          <BridgeFluid cameraZ={cameraZ} />
        </motion.div>

        <motion.div
          aria-hidden="true"
          style={{ opacity: vignetteOpacity }}
          className="absolute inset-0 z-[10] pointer-events-none"
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, transparent 38%, rgba(20,17,13,0.85) 92%)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
