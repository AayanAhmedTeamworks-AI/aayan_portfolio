"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Closing portrait. Full-viewport image fades up with a slow scale settle.
 * On first entry, an ambient warm flare blooms behind the bust — pure CSS,
 * no cursor dependency — to mark the page's closing beat. The curator
 * turning on the spot at closing time, in self-contained pixels.
 */
export function ClosingPortrait({
  src,
  alt,
  caption,
  figureLabel,
}: {
  src: string;
  alt: string;
  caption: string;
  figureLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-25% 0px -25% 0px" });
  const reduce = useReducedMotion();

  return (
    <section
      ref={ref}
      className="relative w-full min-h-[100vh] flex flex-col items-center justify-center overflow-hidden bg-canvas py-16"
    >
      {/* Ambient flare — radial sepia gradient that grows + fades behind the bust */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={reduce ? { opacity: 0.4 } : { opacity: 0, scale: 0.8 }}
        animate={
          inView
            ? reduce
              ? { opacity: 0.4 }
              : { opacity: [0, 1, 0.55], scale: [0.8, 1.1, 1] }
            : undefined
        }
        transition={{
          duration: 2.6,
          times: [0, 0.55, 1],
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          background:
            "radial-gradient(ellipse 44% 36% at 50% 50%, rgba(232,192,138,0.22) 0%, rgba(201,163,114,0.10) 38%, rgba(139,107,63,0.04) 60%, transparent 78%)",
        }}
      />
      <motion.figure
        initial={reduce ? false : { opacity: 0, scale: 1.045 }}
        animate={inView ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-3xl px-8"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg ring-1 ring-hairline/60 bg-ink/[0.97]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse 56% 50% at 50% 48%, rgba(201,163,114,0.25) 0%, rgba(139,107,63,0.06) 48%, transparent 74%)",
            }}
          />
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            quality={95}
            className="object-cover"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 70% at 50% 50%, #000 62%, transparent 96%)",
              maskImage:
                "radial-gradient(ellipse 60% 70% at 50% 50%, #000 62%, transparent 96%)",
            }}
          />
        </div>
        <figcaption className="mt-6 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
          <span>{caption}</span>
          <span className="text-sepia/80">{figureLabel}</span>
        </figcaption>
      </motion.figure>
    </section>
  );
}
