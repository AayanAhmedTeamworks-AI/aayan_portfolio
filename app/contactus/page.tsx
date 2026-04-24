import { ChapterHeading } from "@/components/chapter-heading";
import { Reveal } from "@/components/reveal";
import { ArrowCTA } from "@/components/arrow-cta";
import { PortraitNiche } from "@/components/portrait-niche";

export default function Contactus() {
  return (
    <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
      <ChapterHeading
        numeral="IV"
        chapter="Contactus"
        label="Get in touch"
        tagline="Best reached by email. I reply in English or German. Occasionally slow, always honest."
      />

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

        {/* Bio + links */}
        <div className="md:col-span-7">
          <Reveal delay={100}>
            <p className="font-serif text-2xl md:text-[1.75rem] leading-[1.35] tracking-[-0.01em] text-ink/90 max-w-[32ch]">
              <span className="italic text-sepia/90">Syed Aayan Ahmed.</span>{" "}
              Twenty-four, Indian, currently on a practical study semester at
              Technische Hochschule Ingolstadt and working at{" "}
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
              I build AI-adjacent systems that try to be boring in production —
              reliable, auditable, cheap to run, and patient with tired users.
              Most of my working life right now is Python, TypeScript, and a
              stubborn belief that integration is worth more than invention.
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
            <div className="mt-14 flex flex-wrap items-center gap-5">
              <ArrowCTA href="mailto:aayan.ahmed@thi.de" external>
                Send an email
              </ArrowCTA>
              <a
                href="https://de.linkedin.com/in/syedaayanahmed"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/80 hover:text-sepia transition-colors duration-300 underline decoration-hairline underline-offset-8"
              >
                LinkedIn ↗
              </a>
            </div>
            <p className="mt-8 font-mono text-[11px] text-mute tracking-[0.18em]">
              Languages · English · Deutsch (working)
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
