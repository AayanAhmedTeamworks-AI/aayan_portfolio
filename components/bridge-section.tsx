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
 * Two scroll observers:
 *   - main (start start → end end): drives cameraZ across the pin
 *   - fadeIn (start end → start start): drives bridgeOpacity so the
 *     canvas only becomes visible once it's near pin position. Without
 *     this, the bridge bust would render simultaneously with the hero
 *     bust during the scroll-in phase.
 */
export function BridgeSection() {
  const ref = useRef<HTMLDivElement>(null);

  // Drives cameraZ across the pin
  const { scrollYProgress: pinProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const cameraZ = useTransform(pinProgress, [0, 1], [0, 1], {
    clamp: true,
  });

  // Drives the canvas fade-in as the bridge approaches pin
  const { scrollYProgress: enterProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  // 0 when bridge top at viewport bottom, 1 when bridge top at viewport top.
  // Fade in steeply at the very end (only visible once near pin).
  const bridgeOpacity = useTransform(enterProgress, [0.85, 1], [0, 1]);

  // Vignette closes in as the dolly progresses, opens as we approach hand-off
  const vignetteOpacity = useTransform(
    pinProgress,
    [0.15, 0.7, 0.95],
    [0, 0.55, 0.15],
  );

  // Hand-off fade: bridge fades to black at the very end so MuseumTransition
  // iris opens from clean black.
  const handoffFade = useTransform(pinProgress, [0.92, 1], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative w-full"
      style={{ height: "200vh" }}
      data-cursor="Look"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-canvas">
        <motion.div
          style={{ opacity: bridgeOpacity }}
          className="absolute inset-0 z-0"
        >
          <motion.div
            style={{ opacity: handoffFade }}
            className="absolute inset-0"
          >
            <BridgeFluid cameraZ={cameraZ} />
          </motion.div>
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
