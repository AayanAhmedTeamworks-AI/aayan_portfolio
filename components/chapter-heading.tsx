import { Meander } from "./meander";

type Props = {
  /** Roman numeral only, e.g. "I", "II", "III", "IV". Becomes a named
   *  view-transition target via `.chapter-numeral-{lower}`. */
  numeral?: string;
  /** Chapter word displayed after the numeral, e.g. "Praxis". */
  chapter?: string;
  /** The big display heading underneath the numeral line. */
  label: string;
  tagline?: string;
};

/**
 * Roman-numeral chapter header. The numeral is wrapped in a span whose
 * class drives the view-transition morph between the chapter-index card
 * on `/` and the chapter page's `<h1>` — same element across pages,
 * different position.
 */
export function ChapterHeading({ numeral, chapter, label, tagline }: Props) {
  const vtClass = numeral
    ? `chapter-numeral-${numeral.toLowerCase().replace(/\W+/g, "")}`
    : undefined;

  return (
    <div className="flex items-end justify-between gap-8 border-b border-hairline pb-8">
      <div className="min-w-0">
        {numeral ? (
          <p className="mb-3 font-serif text-xl italic tracking-tight text-sepia/85 md:text-2xl">
            {vtClass ? (
              <span className={vtClass}>{numeral}</span>
            ) : (
              <span>{numeral}</span>
            )}
            {chapter ? (
              <span className="text-sepia/70"> · {chapter}</span>
            ) : null}
          </p>
        ) : null}
        <h1 className="font-serif text-5xl leading-[0.95] tracking-[-0.03em] text-ink md:text-7xl">
          {label}
        </h1>
        {tagline ? (
          <p className="mt-6 max-w-xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.24em] text-mute">
            {tagline}
          </p>
        ) : null}
      </div>
      <Meander className="mb-4 hidden h-3 w-40 shrink-0 text-sepia/55 md:block" />
    </div>
  );
}
