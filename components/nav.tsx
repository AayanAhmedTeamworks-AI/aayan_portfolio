import Link from "next/link";

/**
 * Single-page-architecture nav. No section list — the page is one continuous
 * scroll, and section labels would just be reinventing chapter pages in
 * miniature. Brand on the left, year on the right, hairline beneath.
 */
export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-canvas/70 backdrop-blur-md border-b border-hairline/60">
      <nav className="max-w-[90rem] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-[17px] tracking-tight text-ink hover:text-sepia transition-colors duration-300"
          data-cursor="Top"
        >
          <span className="italic">Codex</span> Ahmed
        </Link>
        <Link
          href="/#lab"
          className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute hover:text-sepia transition-colors duration-300 hidden sm:inline"
        >
          Lab
        </Link>
      </nav>
    </header>
  );
}
