import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DropCapProps = {
  children: ReactNode;
  className?: string;
};

export default function DropCap({ children, className }: DropCapProps) {
  return (
    <p
      className={cn(
        "[&::first-letter]:font-serif [&::first-letter]:italic [&::first-letter]:text-sepia [&::first-letter]:text-[5rem] [&::first-letter]:leading-[0.85] [&::first-letter]:float-left [&::first-letter]:pr-[0.6rem] [&::first-letter]:pt-[0.3rem] [&::first-letter]:tracking-[-0.04em]",
        className,
      )}
    >
      {children}
    </p>
  );
}
