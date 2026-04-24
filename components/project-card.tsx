import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

export type Project = {
  slug?: string;
  title: string;
  client: string;
  year: string;
  stack: string;
  blurb: string;
  size: "hero" | "wide" | "narrow" | "half";
  external?: string;
};

/**
 * Praxis project card — the vitrine.
 *
 * Double-bezel carried over from the original card: an outer marble shell
 * with a hairline ring, an inner canvas-coloured core holding the text.
 * On top of that the inner core gets the vitrine treatment:
 *   - a second hairline inner border (the glass-case rim)
 *   - an ultra-diffuse inset shadow (the depth behind the glass)
 *   - a 1px top highlight (the edge of the glass catching light)
 *   - four tiny brass corner markers at ≤30% opacity (the mounting pegs)
 *
 * The corner markers are four absolutely-positioned spans rather than
 * ::before/::after. Four corners needed > two pseudo slots available;
 * spans keep the CSS legible and the brass offset consistent.
 */
export function ProjectCard({ p }: { p: Project }) {
  const inner = (
    <article className="group/card relative h-full rounded-2xl bg-marble/30 ring-1 ring-hairline p-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-sepia/50 group-hover:bg-marble/45 group-hover:-translate-y-[2px]">
      <div
        className="relative h-full rounded-[calc(1rem-6px)] bg-canvas/70 p-8 md:p-10 flex flex-col min-h-[18rem] ring-1 ring-hairline/70"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {/* Four brass corner markers — mounting pegs of the vitrine */}
        <CornerMark className="top-[9px] left-[9px]" />
        <CornerMark className="top-[9px] right-[9px]" />
        <CornerMark className="bottom-[9px] left-[9px]" />
        <CornerMark className="bottom-[9px] right-[9px]" />

        <div className="flex items-baseline justify-between gap-4 mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            {p.year}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/80 text-right">
            {p.client}
          </span>
        </div>
        <h3 className="font-serif text-[2rem] md:text-[2.75rem] tracking-[-0.025em] leading-[0.98] text-ink group-hover:text-sepia transition-colors duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          {p.title}
        </h3>
        <p className="mt-6 text-[14.5px] leading-[1.7] text-ink/75 max-w-[56ch]">
          {p.blurb}
        </p>
        <div className="mt-auto pt-10 flex items-center gap-4">
          <p className="font-mono text-[10.5px] text-mute tracking-wide flex-1">
            {p.stack}
          </p>
          {p.slug || p.external ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-canvas ring-1 ring-hairline transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-sepia/50 group-hover:translate-x-[2px] group-hover:-translate-y-[1px]">
              <ArrowUpRightIcon size={12} weight="light" />
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (p.slug) {
    return (
      <Link href={p.slug} className="group block h-full">
        {inner}
      </Link>
    );
  }
  if (p.external) {
    return (
      <a
        href={p.external}
        target="_blank"
        rel="noreferrer"
        className="group block h-full"
      >
        {inner}
      </a>
    );
  }
  return <div className="group block h-full">{inner}</div>;
}

function CornerMark({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute block h-[3px] w-[3px] bg-sepia/30 ${className}`}
    />
  );
}
