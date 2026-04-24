import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

type Props = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
};

export function ArrowCTA({ href, children, external = false }: Props) {
  const baseClass =
    "group inline-flex items-center gap-3 rounded-full bg-ink text-canvas pl-5 pr-2 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] hover:bg-sepia";

  const inner = (
    <>
      <span>{children}</span>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-canvas/15 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[1px] group-hover:bg-canvas/25">
        <ArrowUpRightIcon size={11} weight="light" />
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={baseClass}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={baseClass}>
      {inner}
    </Link>
  );
}
