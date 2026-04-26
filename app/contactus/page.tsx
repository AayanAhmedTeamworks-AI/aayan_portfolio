import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { PageTurn } from "@/components/page-turn";
import { ArrowCTA } from "@/components/arrow-cta";
import { BackgroundMarquee } from "@/components/background-marquee";
import { MagneticButton } from "@/components/magnetic-button";

export default function Contactus() {
  return (
    <>
      <ChapterProgress />
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
        <ChapterCover
          numeral="V"
          chapter="Contactus"
          label="Get in touch"
          tagline="Best reached by email. I reply in English or German. Occasionally slow, always honest."
        />

        {/* High-impact CTA — the whole page is the CTA. */}
        <section className="relative my-24 min-h-[58vh] flex items-center justify-center overflow-hidden">
          <BackgroundMarquee text="Scribe mihi" speed={20} opacity={0.07} />
          <div className="relative z-10 text-center px-4 w-full">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-sepia mb-8">
              ¶ Epistola
            </p>
            <h2 className="font-serif text-[clamp(4.5rem,12vw,11rem)] tracking-[-0.04em] leading-[0.92] text-ink">
              Let&apos;s
              <span className="italic text-sepia/95"> talk.</span>
            </h2>
            <div className="mt-14 flex items-center justify-center gap-8 flex-wrap">
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
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-mute/80">
              Friedberg · Ingolstadt · MMXXVI
            </p>
          </div>
        </section>

        <Colophon numeral="V" />
      </div>
      <PageTurn
        numeral="V"
        chapter="Contactus"
        nextNumeral="VI"
        nextChapter="Experimenta"
        nextHref="/experimenta"
      />
    </>
  );
}
