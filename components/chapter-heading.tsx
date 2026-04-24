import { Meander } from "./meander";

type Props = {
  numeral?: string;
  label: string;
  tagline?: string;
};

export function ChapterHeading({ numeral, label, tagline }: Props) {
  return (
    <div className="flex items-end justify-between gap-8 border-b border-hairline pb-8">
      <div className="min-w-0">
        {numeral ? (
          <p className="font-serif italic text-sepia/85 text-xl md:text-2xl tracking-tight mb-3">
            {numeral}
          </p>
        ) : null}
        <h1 className="font-serif text-5xl md:text-7xl tracking-[-0.03em] leading-[0.95] text-ink">
          {label}
        </h1>
        {tagline ? (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.24em] text-mute max-w-xl leading-relaxed">
            {tagline}
          </p>
        ) : null}
      </div>
      <Meander className="hidden md:block h-3 w-40 text-sepia/55 mb-4 shrink-0" />
    </div>
  );
}
