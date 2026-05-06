import Link from "next/link";

/**
 * Lean single-page-architecture footer. Two short rows of metadata, no chapter
 * list, no marquee. The closing crescendo two sections above already does the
 * cinematic close — this is the colophon at the back of the catalogue.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline/70">
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-12">
          <div className="md:col-span-6">
            <p className="font-serif text-[2.2rem] leading-none tracking-[-0.025em]">
              Codex <span className="italic text-sepia/90">Ahmed</span>
            </p>
            <p className="mt-4 text-sm leading-[1.7] text-ink/70 max-w-[42ch]">
              Friedberg · Ingolstadt · MMXXVI. AI orchestration,
              offline-first PWAs, and workflow automation for small and
              medium-sized firms in the DACH region.
            </p>
          </div>
          <div className="md:col-span-3 md:col-start-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-4">
              Elsewhere
            </p>
            <ul className="space-y-2.5 font-mono text-[12px]">
              <li>
                <a
                  href="https://www.linkedin.com/in/syedaayanahmed"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  LinkedIn ↗
                </a>
              </li>
              <li>
                <a
                  href="mailto:syedaayan2001@gmail.com"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  syedaayan2001@gmail.com
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
              <li>
                <Link
                  href="/experimenta/tokenizer"
                  className="text-ink/85 hover:text-sepia transition-colors duration-300"
                >
                  Tokenizer comparator ↗
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-hairline/70 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
          <span>© MMXXVI · Syed Aayan Ahmed</span>
          <span className="hidden md:inline">Handmade in Bavaria</span>
        </div>
      </div>
    </footer>
  );
}
