import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GutterSectionProps = {
  numeral: string;
  children: ReactNode;
  className?: string;
};

export default function GutterSection({
  numeral,
  children,
  className,
}: GutterSectionProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden="true"
        className="hidden lg:block absolute left-[-3.5rem] top-[0.4em] font-mono text-[10px] uppercase tracking-[0.22em] text-sepia/70 select-none pointer-events-none"
      >
        {"§ " + numeral}
      </span>
      {children}
    </div>
  );
}
