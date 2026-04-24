import Link from "next/link";
import { ChapterHeading } from "@/components/chapter-heading";
import { Reveal } from "@/components/reveal";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

type Project = {
  slug?: string;
  title: string;
  client: string;
  year: string;
  stack: string;
  blurb: string;
  size: "hero" | "wide" | "narrow" | "half";
  external?: string;
};

const projects: Project[] = [
  {
    slug: "/praxis/baumann",
    title: "Bautagesbericht Pro",
    client: "Baumann GmbH · via Teamworks AI",
    year: "2025 — 2026",
    stack: "React · TypeScript · Supabase · Workbox · i18next · Fonio.ai",
    blurb:
      "An offline-first construction daily-reporting PWA with a German voice-agent that turns a 15-minute form into a 4-minute phone call. Seven languages, three roles, 15 kLOC.",
    size: "hero",
  },
  {
    title: "n8n automation suite",
    client: "Teamworks AI · internal + clients",
    year: "2025 — 2026",
    stack: "n8n · Microsoft Graph · CAPMO · Groq · SerpAPI",
    blurb:
      "Four orchestrations in production: Outlook → CAPMO ticket reconciliation, an attachment pipeline, an employee-acquisition ranker on Llama 3.3 70B, and a B2B partner-firm prospector.",
    size: "wide",
  },
  {
    title: "OpenCLAW on-prem",
    client: "Confidential client · via Teamworks AI",
    year: "2026",
    stack: "Ubuntu · Docker Compose · Caddy · SSO",
    blurb:
      "On-premise deployment of an AI orchestration platform for a client with data-sovereignty constraints. SSH hardening, TLS with Let's Encrypt, nightly backups.",
    size: "narrow",
  },
];

function sizeClass(s: Project["size"]) {
  switch (s) {
    case "hero":
      return "md:col-span-6";
    case "wide":
      return "md:col-span-4";
    case "narrow":
      return "md:col-span-2";
    case "half":
      return "md:col-span-3";
  }
}

export default function Praxis() {
  return (
    <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
      <ChapterHeading
        numeral="I"
        chapter="Praxis"
        label="Production work"
        tagline="Shipped systems for firms in the DACH region. Restraint as discipline; integration as the unit of value."
      />

      <div className="mt-20 grid grid-cols-1 md:grid-cols-6 gap-8 auto-rows-min">
        {projects.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 100}
            className={sizeClass(p.size)}
          >
            <ProjectCard p={p} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const inner = (
    <article className="h-full rounded-2xl bg-marble/30 ring-1 ring-hairline p-2 transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:ring-sepia/50 group-hover:bg-marble/45 group-hover:-translate-y-[2px]">
      <div className="h-full rounded-[calc(1rem-6px)] bg-canvas/70 p-8 md:p-10 flex flex-col min-h-[18rem]">
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
