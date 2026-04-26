import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { ReadingFocus } from "@/components/reading-focus";
import { Reveal } from "@/components/reveal";
import { ArrowCTA } from "@/components/arrow-cta";
import { PortraitNiche } from "@/components/portrait-niche";
import { BackgroundMarquee } from "@/components/background-marquee";
import { MagneticButton } from "@/components/magnetic-button";

export default function Contactus() {
  return (
    <>
      <ChapterProgress />
      <ReadingFocus selector="[data-reading-focus] p" />
      <div
        data-reading-focus
        className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16"
      >
        <ChapterCover
          numeral="IV"
          chapter="Contactus"
          label="Get in touch"
          tagline="Best reached by email. I reply in English or German. Occasionally slow, always honest."
        />

        {/* High-impact CTA section — Patel-style minimalist hero contact */}
        <section className="relative my-32 min-h-[44vh] flex items-center justify-center overflow-hidden">
          <BackgroundMarquee text="Scribe mihi" speed={20} opacity={0.07} />
          <div className="relative z-10 text-center px-4 w-full">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-8">
              ¶ Epistola
            </p>
            <h2 className="font-serif text-[clamp(4rem,11vw,10rem)] tracking-[-0.04em] leading-[0.92] text-ink">
              Let&apos;s
              <span className="italic text-sepia/95"> talk.</span>
            </h2>
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
            <p className="mt-12 font-mono text-[12px] tracking-[0.18em] text-mute">
              aayan.ahmed@thi.de
            </p>
          </div>
        </section>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 items-start">
          {/* Portraits — fig. i photograph paired with fig. ii sculpted bust */}
          <div className="md:col-span-5 space-y-14">
            <Reveal delay={0}>
              <PortraitNiche
                src="/portrait-valencia.jpg"
                alt="Portrait of Syed Aayan Ahmed, València"
                width={900}
                height={1200}
                caption="València, MMXXV"
                figureLabel="fig. i"
                variant="plate"
                priority
              />
            </Reveal>
            <Reveal delay={150}>
              <PortraitNiche
                src="/bust.png"
                alt="Sculpted marble portrait of Syed Aayan Ahmed"
                width={1032}
                height={1328}
                caption="MMXXVI"
                figureLabel="fig. ii"
                variant="niche"
              />
            </Reveal>
          </div>

          {/* Bio + open-to */}
          <div className="md:col-span-7">
            <Reveal delay={100}>
              <p className="font-serif text-2xl md:text-[1.75rem] leading-[1.35] tracking-[-0.01em] text-ink/90 max-w-[32ch]">
                <span className="italic text-sepia/90">
                  Syed Aayan Ahmed.
                </span>{" "}
                Twenty-four, Indian, currently on a practical study semester
                at Technische Hochschule Ingolstadt and working at{" "}
                <a
                  href="https://tmwrks-ai.de"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-sepia/50 underline-offset-4 hover:decoration-sepia transition"
                >
                  Teamworks AI
                </a>{" "}
                in Friedberg, Bavaria.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <p className="mt-10 text-[15px] leading-[1.8] text-ink/75 max-w-[58ch]">
                I build AI-adjacent systems that try to be boring in
                production — reliable, auditable, cheap to run, and patient
                with tired users. Most of my working life right now is
                Python, TypeScript, and a stubborn belief that integration is
                worth more than invention.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="mt-14 border-t border-hairline pt-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-6">
                  Open to
                </p>
                <ul className="space-y-3 font-serif text-xl md:text-2xl text-ink/85 tracking-tight leading-snug">
                  <li>— Thesis collaboration on applied LLM systems.</li>
                  <li>— DACH-SME automation engagements.</li>
                  <li>— Thoughtful internship continuations.</li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={400}>
              <p className="mt-14 font-mono text-[11px] text-mute tracking-[0.18em]">
                Languages · English · Deutsch (working)
              </p>
            </Reveal>
          </div>
        </div>

        <Colophon numeral="IV" />
      </div>
    </>
  );
}
