"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Contact section, shader.se-lean. Big italic "Hello." headline arrives via
 * scroll-linked clip-path; the body sentence follows; the email itself is
 * the primary CTA — rendered at headline scale, hover lights it sepia.
 * Quiet metadata column on the right (LinkedIn / CV / Teamworks / address).
 *
 * No magnetic buttons, no marquee. The address is the catalogue label.
 */
export function ContactSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });
  const helloClip = useTransform(
    scrollYProgress,
    [0, 0.35],
    ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
  );

  return (
    <section
      ref={ref}
      id="contact"
      className="relative w-full min-h-[100vh] flex items-center py-24"
      data-cursor="Read"
    >
      <div className="mx-auto max-w-[90rem] w-full px-8 md:px-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-end">
        {/* Left — the statement */}
        <div className="md:col-span-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia/85 mb-6">
            iv · Epistola
          </p>

          <motion.h2
            style={{ clipPath: helloClip }}
            className="font-serif italic text-[clamp(5rem,16vw,14rem)] leading-[0.92] tracking-[-0.045em] text-ink"
          >
            Hello.
          </motion.h2>

          <p className="mt-12 max-w-[44ch] font-serif text-2xl md:text-[1.65rem] leading-[1.32] tracking-[-0.005em] text-ink/85">
            I&apos;m in Augsburg, mostly writing code.{" "}
            <span className="italic text-sepia/95">
              I read every email I get and answer most of them.
            </span>{" "}
            Say something.
          </p>

          <a
            href="mailto:syedaayan2001@gmail.com"
            data-cursor="Mail"
            className="group mt-14 inline-flex items-baseline gap-2 font-serif text-[clamp(1.6rem,4.6vw,3rem)] leading-none tracking-[-0.018em] text-ink hover:text-sepia transition-colors duration-500"
          >
            <span className="italic">syedaayan2001</span>
            <span className="text-mute group-hover:text-sepia transition-colors duration-500">
              @gmail.com
            </span>
            <span className="ml-3 text-sepia/85 transition-transform duration-500 group-hover:translate-x-1">
              ↗
            </span>
          </a>
        </div>

        {/* Right — quiet metadata column */}
        <div className="md:col-span-4 md:text-right space-y-4 font-mono text-[11px] uppercase tracking-[0.24em]">
          <p className="text-mute mb-6 not-italic">Elsewhere</p>
          <p>
            <a
              href="https://www.linkedin.com/in/syedaayanahmed"
              target="_blank"
              rel="noreferrer"
              className="text-ink/85 hover:text-sepia transition-colors duration-300"
            >
              LinkedIn ↗
            </a>
          </p>
          <p>
            <a
              href="/aayan-ahmed-cv.pdf"
              className="text-ink/85 hover:text-sepia transition-colors duration-300"
            >
              Curriculum Vitæ ↗
            </a>
          </p>
          <p>
            <a
              href="https://tmwrks-ai.de"
              target="_blank"
              rel="noreferrer"
              className="text-ink/85 hover:text-sepia transition-colors duration-300"
            >
              Teamworks AI ↗
            </a>
          </p>
          <p className="pt-4 mt-8 border-t border-hairline text-mute">
            Augsburg · Ingolstadt
            <br />
            MMXXVI
            <br />
            English · Deutsch (working)
          </p>
        </div>
      </div>
    </section>
  );
}
