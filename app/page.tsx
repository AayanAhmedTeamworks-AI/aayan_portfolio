import { FrontispieceBust } from "@/components/frontispiece-bust";
import { Reveal } from "@/components/reveal";
import { Meander } from "@/components/meander";
import { VTLink } from "@/components/vt-link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";

const chapters = [
  {
    numeral: "I",
    name: "Praxis",
    slug: "/praxis",
    blurb:
      "Production systems shipped at Teamworks AI — an offline-first construction PWA with a German voice-agent, n8n orchestrations integrating Microsoft Graph / CAPMO / Groq, and on-prem deployments for data-sovereign clients.",
    meta: "Six works",
    ref: "CAT. I — SIX WORKS",
  },
  {
    numeral: "II",
    name: "Studia",
    slug: "/studia",
    blurb:
      "Research and academic pieces. Generative-Engine Optimization, explainable AI with LIME and saliency maps, notes from THI Ingolstadt.",
    meta: "Three pieces",
    ref: "CAT. II — THREE PIECES",
  },
  {
    numeral: "III",
    name: "Civitas",
    slug: "/civitas",
    blurb:
      "Public and social-impact work. A service-design project for underserved drivers, and past fundraising with Amnesty International.",
    meta: "Two efforts",
    ref: "CAT. III — TWO EFFORTS",
  },
  {
    numeral: "IV",
    name: "Contactus",
    slug: "/contactus",
    blurb:
      "Get in touch. Open to thesis collaboration, DACH-SME automation engagements, and thoughtful internship continuations.",
    meta: "Get in touch",
    ref: "CAT. IV — LETTER",
  },
];

export default function Home() {
  return (
    <>
      {/* Frontispiece */}
      <section
        className="relative min-h-[100dvh] flex flex-col overflow-hidden"
        data-cursor="Look"
        data-cursor-ref="CODEX AHMED · FOL. I"
      >
        {/* Bust relief + dust — one R3F canvas, full-bleed, absolute */}
        <FrontispieceBust />

        {/* Ambient warm wash */}
        <div className="ambient-glow" />

        {/* Mobile legibility wash — fades the bust behind the text on narrow screens */}
        <div
          className="md:hidden absolute inset-0 z-[5] pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(245,239,227,0.7) 0%, rgba(245,239,227,0.35) 40%, rgba(245,239,227,0.1) 100%)",
          }}
        />

        <div className="relative z-20 flex-1 flex flex-col justify-center max-w-[90rem] mx-auto w-full px-8 md:px-16 pt-32 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-6 lg:col-span-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute mb-8">
                Codex · MMXXVI · Friedberg / Ingolstadt
              </p>
              <h1 className="font-serif text-[clamp(3.5rem,9.5vw,9rem)] leading-[0.92] tracking-[-0.04em] text-ink">
                Syed Aayan
                <br />
                <span className="italic text-sepia/95">Ahmed.</span>
              </h1>
              <p className="font-serif italic text-2xl md:text-[1.75rem] leading-[1.2] text-ink/75 mt-10 max-w-[26ch] tracking-[-0.01em]">
                Engineer of durable AI systems — making LLMs boring, on
                purpose.
              </p>

              <div className="mt-12 border-l border-hairline pl-5 max-w-sm">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/90 mb-3">
                  Open to
                </p>
                <ul className="font-mono text-[12px] leading-[1.9] text-ink/80 tracking-wide space-y-0.5">
                  <li>— Thesis collaboration</li>
                  <li>— DACH-SME automation</li>
                  <li>— Thoughtful internships</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-20 flex items-center gap-4 text-mute">
            <Meander className="h-3 w-28 text-sepia/55" />
            <span className="font-mono text-[10px] uppercase tracking-[0.32em]">
              Scroll to enter
            </span>
          </div>
        </div>
      </section>

      {/* Chapters Index */}
      <section className="relative max-w-[90rem] mx-auto px-8 md:px-16 py-32 md:py-40">
        <div className="flex items-end justify-between gap-8 border-b border-hairline pb-8 mb-20">
          <div>
            <p className="font-serif italic text-sepia/80 text-xl tracking-tight mb-2">
              —
            </p>
            <h2 className="font-serif text-5xl md:text-7xl tracking-[-0.03em] leading-[0.95]">
              Index
            </h2>
          </div>
          <Meander className="hidden md:block h-3 w-40 text-sepia/55 mb-4 shrink-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
          {chapters.map((c, i) => (
            <Reveal key={c.numeral} delay={i * 100}>
              <VTLink
                href={c.slug}
                className="group block"
                data-cursor-ref={c.ref}
              >
                <div className="flex items-baseline gap-6">
                  <span
                    className={`font-serif italic text-sepia/70 text-3xl md:text-4xl tracking-tight chapter-numeral-${c.numeral.toLowerCase()}`}
                  >
                    {c.numeral}
                  </span>
                  <h3 className="font-serif text-5xl md:text-[4.5rem] tracking-[-0.03em] leading-none text-ink group-hover:text-sepia transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                    {c.name}
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.75] text-ink/70 mt-6 max-w-[52ch]">
                  {c.blurb}
                </p>
                <div className="mt-10 flex items-center gap-4 text-mute group-hover:text-sepia transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
                    {c.meta}
                  </span>
                  <span className="h-px bg-hairline flex-1 group-hover:bg-sepia/45 transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]" />
                  <ArrowRightIcon size={13} weight="light" />
                </div>
              </VTLink>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
