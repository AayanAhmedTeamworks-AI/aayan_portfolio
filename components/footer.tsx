import Link from "next/link";
import { Meander } from "./meander";
import { VTLink } from "./vt-link";

const chapters = [
  { n: "I", l: "Praxis", h: "/praxis" },
  { n: "II", l: "Studia", h: "/studia" },
  { n: "III", l: "Civitas", h: "/civitas" },
  { n: "IV", l: "Contactus", h: "/contactus" },
];

export function Footer() {
  return (
    <footer className="mt-40 border-t border-hairline/70">
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-16 pb-12">
        <Meander className="h-4 w-full text-sepia/55 mb-16" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 gap-x-12">
          <div className="md:col-span-5">
            <p className="font-serif text-[2.75rem] leading-none tracking-[-0.025em]">
              Codex <span className="italic text-sepia/90">Ahmed</span>
            </p>
            <p className="mt-5 text-sm leading-[1.7] text-ink/70 max-w-[38ch]">
              Friedberg · Ingolstadt. Work spanning LLM orchestration,
              offline-first PWAs, and workflow automation for small and
              medium-sized firms in the DACH region.
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-5">
              Chapters
            </p>
            <ul className="space-y-2.5">
              {chapters.map((c) => (
                <li key={c.h}>
                  <VTLink
                    href={c.h}
                    className="font-serif text-lg text-ink/85 hover:text-sepia transition-colors duration-300"
                  >
                    <span className="text-sepia/65 italic mr-2 text-base">
                      {c.n}
                    </span>
                    {c.l}
                  </VTLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-5">
              Elsewhere
            </p>
            <ul className="space-y-2.5 font-mono text-[13px]">
              <li>
                <a
                  href="https://de.linkedin.com/in/syedaayanahmed"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a
                  href="mailto:aayan.ahmed@thi.de"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  Email ↗
                </a>
              </li>
              <li>
                <a
                  href="https://tmwrks-ai.de"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  Teamworks AI ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-6 border-t border-hairline/70 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
          <span>© MMXXVI · Syed Aayan Ahmed</span>
          <span className="hidden md:inline">Handmade in Bavaria</span>
          <span>Codex v. i</span>
        </div>
      </div>
    </footer>
  );
}
