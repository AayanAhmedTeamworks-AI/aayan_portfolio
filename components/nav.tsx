import Link from "next/link";
import { VTLink } from "./vt-link";

const items = [
  { label: "Praxis", numeral: "I", href: "/praxis" },
  { label: "Studia", numeral: "II", href: "/studia" },
  { label: "Civitas", numeral: "III", href: "/civitas" },
  { label: "Contactus", numeral: "IV", href: "/contactus" },
];

export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-30 bg-canvas/75 backdrop-blur-md border-b border-hairline/60">
      <nav className="max-w-[90rem] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-[17px] tracking-tight text-ink hover:text-sepia transition-colors duration-300"
        >
          <span className="italic">Codex</span> Ahmed
        </Link>
        <ul className="hidden md:flex items-center gap-8 lg:gap-10">
          {items.map((it) => (
            <li key={it.href}>
              <VTLink
                href={it.href}
                className="group flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-mute hover:text-ink transition-colors duration-300"
              >
                <span className="font-serif italic text-sepia/75 text-sm">
                  {it.numeral}
                </span>
                <span>{it.label}</span>
              </VTLink>
            </li>
          ))}
        </ul>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-mute hidden md:inline">
          MMXXVI
        </span>
      </nav>
    </header>
  );
}
