"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BridgeFluid } from "@/components/bridge-fluid";

/**
 * Bridge — the bust dissolves into ink (B2). 200vh sticky section.
 * dissolveProgress goes 0 → 1 across the pin scroll. The BridgeFluid
 * canvas owns the rendering: bust framed at the hero's right-column
 * position, dissolve front sweeps top-to-bottom via FBM noise, dissolved
 * pixels become ink injected into the fluid sim, ink drifts down + out
 * with the velocity field. Hand-off to MuseumTransition is a black fade.
 *
 * Two scroll observers:
 *   - pinProgress (start start → end end): drives dissolveProgress
 *   - enterProgress (start end → start start): drives canvas fade-in so
 *     the bridge canvas isn't visible during the scroll-in overlap with
 *     the hero's still-fading bust.
 */
export function BridgeSection() {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress: pinProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // dissolveProgress runs slightly past pin so the dissolve actually
  // completes before the iris hand-off begins.
  const dissolveProgress = useTransform(pinProgress, [0, 0.85], [0, 1], {
    clamp: true,
  });

  const { scrollYProgress: enterProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });
  const bridgeOpacity = useTransform(enterProgress, [0.85, 1], [0, 1]);

  // Hand-off fade — bridge fades to black at the very end so
  // MuseumTransition iris opens from clean black.
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
            <BridgeFluid dissolveProgress={dissolveProgress} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
