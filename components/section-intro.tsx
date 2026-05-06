"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Big cinematic section intro. 100vh tall, sticky-pinned content inside; on
 * scroll-enter the numeral slides in from the left and the title clip-path
 * unmasks letter-by-letter from below. Tagline fades in slightly later. As
 * you scroll past, everything translates up and out.
 *
 * This is the chapter-cover beat the site needed — section transitions that
 * actually arrive instead of just continuing.
 */
export function SectionIntro({
  numeral,
  title,
  tagline,
  align = "left",
  accent,
}: {
  numeral: string;
  title: string;
  tagline?: string;
  align?: "left" | "center";
  accent?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const numeralX = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    ["-32%", "0%", "0%", "-22%"],
  );
  const titleX = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    ["28%", "0%", "0%", "18%"],
  );
  const contentY = useTransform(
    scrollYProgress,
    [0.5, 1],
    ["0%", "-30%"],
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.78, 1],
    [0, 1, 1, 0],
  );
  const titleClip = useTransform(
    scrollYProgress,
    [0.15, 0.45],
    ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
  );

  // Split letters for staggered slide-in within the clip
  const letters = title.split("");

  return (
    <section
      ref={ref}
      className="relative w-full h-[140vh] overflow-clip"
      data-cursor="Read"
    >
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        <motion.div
          style={{ y: contentY, opacity }}
          className={
            "relative z-10 mx-auto w-full max-w-[90rem] px-8 md:px-16 " +
            (align === "center" ? "text-center" : "")
          }
        >
          <motion.span
            style={{ x: numeralX }}
            className="block font-serif italic text-sepia/85 text-[clamp(7rem,22vw,18rem)] leading-[0.85] tracking-[-0.04em]"
          >
            {numeral}.
          </motion.span>

          <motion.h2
            style={{ x: titleX, clipPath: titleClip }}
            className="mt-2 font-serif text-[clamp(3rem,11vw,10rem)] leading-[0.92] tracking-[-0.04em] text-ink"
          >
            {letters.map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden={ch === " "}
                className="inline-block"
                initial={{ y: "100%" }}
                whileInView={{ y: "0%" }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{
                  duration: 0.85,
                  delay: i * 0.022,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {ch === " " ? " " : ch}
              </motion.span>
            ))}
            <span className="italic text-sepia/95">.</span>
          </motion.h2>

          {tagline ? (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={
                "mt-10 font-serif italic text-mute text-lg md:text-xl max-w-[60ch] " +
                (align === "center" ? "mx-auto" : "")
              }
            >
              {tagline}
            </motion.p>
          ) : null}

          {accent ? <div className="mt-10">{accent}</div> : null}
        </motion.div>
      </div>
    </section>
  );
}
