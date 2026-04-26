"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { BackgroundMarquee } from "./background-marquee";
import { MagneticButton } from "./magnetic-button";
import { ArrowCTA } from "./arrow-cta";

const TOTAL = 4;

/**
 * Scroll-pinned billboard, four cards. The Patel pattern:
 *   - Outer container is `TOTAL * 100vh` tall
 *   - Inner content is sticky-pinned to the viewport
 *   - Big "Syed Aayan Ahmed" marquee is the always-on background
 *   - Each scroll quartile, one card slides up into the centre, holds,
 *     then slides up and out as the next floats in
 *
 * All transforms are scroll-linked via framer-motion's MotionValues —
 * no setState per scroll, no React re-renders. Honors prefers-reduced-
 * motion via framer-motion's internal handling of MotionValue easing.
 */
export function ContactusBillboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${TOTAL * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <BackgroundMarquee text="Syed Aayan Ahmed" speed={18} opacity={0.07} />
        <BillboardCard index={0} progress={scrollYProgress}>
          <Card1 />
        </BillboardCard>
        <BillboardCard index={1} progress={scrollYProgress}>
          <Card2 />
        </BillboardCard>
        <BillboardCard index={2} progress={scrollYProgress}>
          <Card3 />
        </BillboardCard>
        <BillboardCard index={3} progress={scrollYProgress}>
          <Card4 />
        </BillboardCard>

        {/* Card position indicator (bottom centre) — i / iv */}
        <ProgressDots progress={scrollYProgress} />
      </div>
    </section>
  );
}

function BillboardCard({
  index,
  progress,
  children,
}: {
  index: number;
  progress: MotionValue<number>;
  children: ReactNode;
}) {
  const start = index / TOTAL;
  const end = (index + 1) / TOTAL;
  const fade = 0.05;

  const y = useTransform(
    progress,
    [
      Math.max(0, start - fade),
      start,
      end - fade,
      Math.min(1, end + fade),
    ],
    ["55%", "0%", "0%", "-55%"],
  );

  const opacity = useTransform(
    progress,
    [
      Math.max(0, start - fade * 0.5),
      start + fade * 0.5,
      end - fade,
      Math.min(1, end + fade * 0.5),
    ],
    [0, 1, 1, 0],
  );

  const rotateX = useTransform(
    progress,
    [
      Math.max(0, start - fade),
      start,
      end - fade,
      Math.min(1, end + fade),
    ],
    [30, 0, 0, -30],
  );

  return (
    <motion.div
      style={{
        y,
        opacity,
        rotateX,
        transformPerspective: 1400,
        transformStyle: "preserve-3d",
      }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
    >
      <div className="relative z-10 pointer-events-auto max-w-4xl w-full text-center">
        {children}
      </div>
    </motion.div>
  );
}

function ProgressDots({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none">
      {Array.from({ length: TOTAL }).map((_, i) => (
        <Dot key={i} index={i} progress={progress} />
      ))}
    </div>
  );
}

function Dot({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const start = index / TOTAL;
  const end = (index + 1) / TOTAL;
  const opacity = useTransform(
    progress,
    [
      Math.max(0, start - 0.02),
      start + 0.02,
      end - 0.02,
      Math.min(1, end + 0.02),
    ],
    [0.25, 1, 1, 0.25],
  );
  const scale = useTransform(
    progress,
    [Math.max(0, start - 0.02), start + 0.02, end - 0.02, Math.min(1, end + 0.02)],
    [1, 1.6, 1.6, 1],
  );
  return (
    <motion.span
      style={{ opacity, scale }}
      className="block h-1 w-1 rounded-full bg-sepia"
    />
  );
}

/* ---------- Card content ---------- */

function Card1() {
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-8">
        ¶ V · Contactus
      </p>
      <h2 className="font-serif text-[clamp(4rem,11vw,10rem)] tracking-[-0.04em] leading-[0.92] text-ink">
        Syed Aayan
        <br />
        <span className="italic text-sepia/95">Ahmed.</span>
      </h2>
      <p className="mt-10 font-serif italic text-2xl md:text-3xl text-ink/80">
        Engineer of durable AI systems.
      </p>
    </>
  );
}

function Card2() {
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-10">
        ¶ Briefly
      </p>
      <p className="font-serif text-3xl md:text-5xl tracking-[-0.02em] leading-[1.18] text-ink">
        I build AI-adjacent systems that try to be{" "}
        <span className="italic text-sepia">boring</span> in production —
        reliable, auditable, cheap to run, and patient with tired users.
      </p>
      <p className="mt-10 font-serif italic text-xl md:text-2xl text-mute leading-[1.4] max-w-3xl mx-auto">
        Most of my working life right now is Python, TypeScript, and a
        stubborn belief that integration is worth more than invention.
      </p>
    </>
  );
}

function Card3() {
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-8">
        ¶ Epistola
      </p>
      <h3 className="font-serif text-[clamp(4.5rem,12vw,11rem)] tracking-[-0.04em] leading-[0.92] text-ink">
        Let&apos;s
        <span className="italic text-sepia/95"> talk.</span>
      </h3>
      <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
        <MagneticButton pull={18}>
          <ArrowCTA href="mailto:aayan.ahmed@thi.de" external>
            Send an email
          </ArrowCTA>
        </MagneticButton>
        <MagneticButton pull={10}>
          <a
            href="https://de.linkedin.com/in/syedaayanahmed"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/80 hover:text-sepia transition-colors duration-300 underline decoration-hairline underline-offset-8"
          >
            LinkedIn ↗
          </a>
        </MagneticButton>
      </div>
      <p className="mt-10 font-mono text-[12px] tracking-[0.18em] text-mute">
        aayan.ahmed@thi.de
      </p>
    </>
  );
}

function Card4() {
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-10">
        ¶ Coordinates
      </p>
      <p className="font-serif text-4xl md:text-6xl tracking-[-0.03em] leading-[1.05] text-ink">
        Friedberg <span className="text-sepia/70">·</span> Ingolstadt
      </p>
      <p className="mt-5 font-serif italic text-2xl md:text-3xl text-sepia/80">
        MMXXVI
      </p>
      <div className="mt-14 max-w-md mx-auto border-t border-hairline pt-10 space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mute">
          English · Deutsch (working)
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-mute">
          Open to · thesis · DACH-SME · internships
        </p>
      </div>
    </>
  );
}
