import { Meander } from "./meander";

type Props = {
  chapter: string;
  client: string;
  year: string;
  role: string;
  stack: string;
  title: string;
  tagline: string;
};

export function CaseHeader({
  chapter,
  client,
  year,
  role,
  stack,
  title,
  tagline,
}: Props) {
  return (
    <header className="pt-32 pb-20">
      <div className="flex items-baseline gap-3 text-mute mb-10">
        <Meander className="h-3 w-24 text-sepia/55 hidden sm:block" />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em]">
          {chapter}
        </span>
      </div>
      <h1 className="font-serif text-[clamp(3rem,9vw,8rem)] leading-[0.92] tracking-[-0.035em]">
        {title}
      </h1>
      <p className="mt-8 font-serif italic text-2xl md:text-3xl text-ink/75 tracking-tight max-w-[40ch] leading-[1.2]">
        {tagline}
      </p>

      <dl className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8 border-t border-hairline pt-6 max-w-4xl">
        <Meta label="Client" value={client} />
        <Meta label="Year" value={year} />
        <Meta label="Role" value={role} />
        <Meta label="Stack" value={stack} />
      </dl>
    </header>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-2">
        {label}
      </dt>
      <dd className="font-serif text-[17px] leading-snug text-ink/90">
        {value}
      </dd>
    </div>
  );
}
