import { ChapterHeading } from "@/components/chapter-heading";
import { Reveal } from "@/components/reveal";

const efforts = [
  {
    title: "Travel Mitar",
    kind: "Ongoing · hobby · India",
    year: "2025 —",
    blurb:
      "A service-design project that tries to close a licensing gap for truck drivers in India who cannot read the long-form paperwork required to renew or transfer their commercial permits. Early prototype work around a voice-first intake flow and illustrated field forms.",
    note:
      "Operating principle: the target user is the design brief. A feature only counts if it survives contact with a busy, tired person standing outside an RTO office.",
  },
  {
    title: "Amnesty International — fundraising",
    kind: "Volunteering · past",
    year: "2023",
    blurb:
      "Face-to-face fundraising for Amnesty International. Door-to-door, high refusal rate, occasional long conversation. The best school I've had for written and spoken persuasion — a hard-won skill that now shows up, quietly, in every README and stakeholder demo.",
    note: null,
  },
];

export default function Civitas() {
  return (
    <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
      <ChapterHeading
        numeral="III"
        chapter="Civitas"
        label="Public & social"
        tagline="Work that is not invoiced. The part of a résumé that usually goes in a footnote, here given its own page."
      />

      <div className="mt-20 space-y-24">
        {efforts.map((e, i) => (
          <Reveal key={e.title} delay={i * 100}>
            <article
              className="grid grid-cols-1 md:grid-cols-12 gap-8"
              data-cursor-ref={
                i === 0 ? "§ ITINERIS · ONGOING" : undefined
              }
            >
              <div className="md:col-span-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                  {e.kind}
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
                  {e.year}
                </p>
              </div>
              <div className="md:col-span-9">
                <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.03em] leading-[0.98] text-ink">
                  {e.title}
                </h2>
                <p className="mt-7 text-[15px] leading-[1.75] text-ink/80 max-w-[62ch]">
                  {e.blurb}
                </p>
                {e.note ? (
                  <p className="mt-6 border-l-2 border-sepia/60 pl-6 font-serif italic text-xl text-ink/75 max-w-[52ch] leading-[1.4]">
                    {e.note}
                  </p>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
