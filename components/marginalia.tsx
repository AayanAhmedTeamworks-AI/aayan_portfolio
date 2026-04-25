import { cn } from "@/lib/utils";

type MarginaliaProps = {
  numeral?: string;
  tag?: string;
  fleuron?: boolean;
  className?: string;
};

/**
 * Printed-book gutter notes, hidden on mobile and visible at `lg+` only.
 *
 * NOTE: The parent element MUST be `relative` for the absolute positioning
 * of this marginalia to anchor correctly.
 */
export default function Marginalia({
  numeral,
  tag,
  fleuron,
  className,
}: MarginaliaProps) {
  if (!numeral && !tag && !fleuron) return null;

  return (
    <aside
      className={cn(
        "hidden lg:block absolute left-[-8rem] top-0 w-[6.5rem] text-right",
        className,
      )}
    >
      {fleuron ? (
        <div className="font-serif italic text-sepia text-base">❦</div>
      ) : null}
      {numeral ? (
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute/80 leading-relaxed">
          {numeral}
        </div>
      ) : null}
      {tag ? (
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute/80 leading-relaxed">
          {tag}
        </div>
      ) : null}
    </aside>
  );
}
