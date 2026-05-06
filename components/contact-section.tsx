import { MagneticButton } from "@/components/magnetic-button";
import { ArrowCTA } from "@/components/arrow-cta";

/**
 * Lean contact block. Three quiet hyperlinks plus one magnetic primary CTA.
 * No billboard, no marquee — the closing crescendo right after handles the
 * cinematic beat. This is the address card on the back of the catalogue.
 */
export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative w-full pt-24 pb-24"
      data-cursor="Read"
    >
      <div className="mx-auto max-w-[60ch] px-8 md:px-0">
        <p className="font-serif text-[clamp(2.2rem,5.6vw,4rem)] leading-[1.05] tracking-[-0.03em] text-ink">
          Open to thesis collaboration, DACH-SME automation, and{" "}
          <span className="italic text-sepia/95">thoughtful</span> internships.
        </p>

        <div className="mt-12 flex items-center gap-8 flex-wrap">
          <MagneticButton pull={18}>
            <ArrowCTA href="mailto:syedaayan2001@gmail.com" external>
              Send an email
            </ArrowCTA>
          </MagneticButton>
          <MagneticButton pull={10}>
            <a
              href="https://www.linkedin.com/in/syedaayanahmed"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/85 hover:text-sepia transition-colors duration-300 underline decoration-hairline underline-offset-8"
            >
              LinkedIn ↗
            </a>
          </MagneticButton>
          <MagneticButton pull={10}>
            <a
              href="/aayan-ahmed-cv.pdf"
              className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink/85 hover:text-sepia transition-colors duration-300 underline decoration-hairline underline-offset-8"
            >
              Curriculum Vitæ ↗
            </a>
          </MagneticButton>
        </div>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.24em] text-mute">
          Friedberg · Ingolstadt · MMXXVI · English · Deutsch (working)
        </p>
      </div>
    </section>
  );
}
