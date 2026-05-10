"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DataOwnershipDemo — Lab artifact ii. Side-by-side topology diagrams of
 * a Supabase-shaped centralised database vs a data-mesh-shaped org.
 * Both render the same five concerns (workers · materials · weather ·
 * incidents · photos), but the ownership topology is the lesson.
 *
 * SVG diagrams (not HTML grids), with stroke-dashoffset line draw-in on
 * scroll-into-view, foreignObject-rendered card content for proper
 * typography, and hover lift on each card. Cross-domain contract lines
 * on the mesh side make federated dependencies visible.
 */

const TABLES: { name: string; cols: string[] }[] = [
  { name: "workers", cols: ["id", "name", "shift_id", "role"] },
  { name: "materials", cols: ["id", "site_id", "qty", "supplier"] },
  { name: "weather", cols: ["site_id", "date", "temp", "rain_mm"] },
  { name: "incidents", cols: ["id", "site_id", "category", "severity"] },
  { name: "photos", cols: ["id", "site_id", "url", "taken_at"] },
];

const DOMAINS: { name: string; team: string; product: string }[] = [
  { name: "Workers", team: "HR ops", product: "current_shifts" },
  { name: "Materials", team: "Procurement", product: "consumption" },
  { name: "Weather", team: "Site ops", product: "conditions" },
  { name: "Incidents", team: "Safety", product: "safety_log" },
  { name: "Photos", team: "Field tech", product: "photo_index" },
];

export function DataOwnershipDemo() {
  return (
    <article className="mt-20">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
          Artifact ii
        </span>
        <span className="h-px bg-hairline flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
          Ownership shape
        </span>
      </div>

      <h3 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink mb-3">
        Same data, two ways of asking{" "}
        <span className="italic text-sepia/95">who&apos;s allowed</span> to
        change it.
      </h3>

      <p className="max-w-[64ch] font-serif italic text-mute text-base leading-relaxed">
        A construction firm tracks site reports &mdash; workers,
        materials, weather, incidents, photos. The shapes below carry
        the lesson: a single platform-team container vs five domain
        islands wired through a contract layer.
      </p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <SupabasePanel />
        <MeshPanel />
      </div>

      <p className="mt-14 mx-auto max-w-[64ch] font-serif italic text-ink/85 text-lg md:text-xl leading-[1.5] text-center">
        A warehouse gives you one source of truth and a schema bottleneck.
        A mesh gives you domain autonomy and governance overhead. Most
        real systems sit somewhere on the curve &mdash; pick the trade you
        can afford the overhead for.
      </p>

      <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        From a thesis-in-progress on systematic review of data-mesh
        patterns &mdash; cite cautiously.
      </p>
    </article>
  );
}

function SupabasePanel() {
  return (
    <PanelShell title="Supabase" mode="centralised" tag="i. one platform">
      <SupabaseDiagram />
      <TradeoffList
        items={[
          { sign: "+", text: "one source of truth · simple backups · joins are free" },
          { sign: "+", text: "RLS gates each row · auth is one decision" },
          { sign: "-", text: "add a column → migration touches everyone" },
          { sign: "-", text: "schema bottleneck · the platform team is the line" },
        ]}
      />
    </PanelShell>
  );
}

function MeshPanel() {
  return (
    <PanelShell title="Data mesh" mode="federated" tag="n. domains">
      <MeshDiagram />
      <TradeoffList
        items={[
          { sign: "+", text: "domain autonomy · changes don't cascade · scales with org" },
          { sign: "+", text: "heterogeneous shapes (transactional, blob, time-series) live natively" },
          { sign: "-", text: "cross-domain joins are contracts, not native SQL" },
          { sign: "-", text: "governance overhead · requires data-as-a-product mindset" },
        ]}
      />
    </PanelShell>
  );
}

function PanelShell({
  title,
  mode,
  tag,
  children,
}: {
  title: string;
  mode: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-marble/30 ring-1 ring-hairline p-1.5">
      <div
        className="rounded-[calc(1rem-4px)] bg-canvas/65 px-5 py-6 md:px-6 md:py-7"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <header className="flex items-baseline justify-between mb-1">
          <h4 className="font-serif text-lg md:text-xl tracking-tight text-ink">
            {title} <span className="text-mute">/</span>{" "}
            <span className="italic text-sepia/85">{mode}</span>
          </h4>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-mute">
            {tag}
          </span>
        </header>
        {children}
      </div>
    </div>
  );
}

function TradeoffList({
  items,
}: {
  items: { sign: "+" | "-"; text: string }[];
}) {
  return (
    <ul className="mt-5 space-y-2 font-mono text-[11px] text-ink/80 leading-[1.6]">
      {items.map((it, i) => (
        <li key={i}>
          <span
            className={
              it.sign === "+" ? "text-sepia/85 mr-2" : "text-mute mr-2"
            }
          >
            {it.sign === "+" ? "＋" : "－"}
          </span>
          {it.text}
        </li>
      ))}
    </ul>
  );
}

/* ────────────────────────────────────────────────────────────
   SVG topology diagrams
   ──────────────────────────────────────────────────────────── */

function useDrawIn() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !drawn) setDrawn(true);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [drawn]);
  return { ref, drawn };
}

function SupabaseDiagram() {
  const { ref, drawn } = useDrawIn();
  return (
    <svg
      ref={ref}
      viewBox="0 0 360 320"
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      role="img"
      aria-label="Supabase: a single platform team owning all five tables"
    >
      <defs>
        <marker
          id="sup-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(201,163,114,0.55)" />
        </marker>
      </defs>

      {/* Outer container — the single platform region. Its presence
          conveys the lesson: everything inside is one platform. */}
      <rect
        x="6"
        y="6"
        width="348"
        height="308"
        rx="8"
        fill="rgba(201,163,114,0.025)"
        stroke="rgba(201,163,114,0.18)"
        strokeWidth="0.6"
        strokeDasharray="3 3"
      />

      {/* Header */}
      <g transform="translate(80, 20)">
        <rect
          width="200"
          height="38"
          rx="3"
          fill="rgba(201,163,114,0.10)"
          stroke="rgba(201,163,114,0.6)"
          strokeWidth="0.7"
        />
        <text
          x="100"
          y="17"
          textAnchor="middle"
          fontSize="9.5"
          fill="rgba(232,192,138,0.95)"
          letterSpacing="2.2"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          PLATFORM TEAM
        </text>
        <text
          x="100"
          y="30"
          textAnchor="middle"
          fontSize="8"
          fill="rgba(125,112,96,0.9)"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          postgres + RLS · single owner
        </text>
      </g>

      {/* Lines from platform team down to each table */}
      <g
        stroke="rgba(201,163,114,0.5)"
        strokeWidth="0.7"
        strokeDasharray="3 3"
        fill="none"
        style={{
          strokeDashoffset: drawn ? 0 : 600,
          transition: "stroke-dashoffset 1.6s ease-out 0.2s",
        }}
      >
        <line x1="180" y1="60" x2="60" y2="100" markerEnd="url(#sup-arrow)" />
        <line x1="180" y1="60" x2="180" y2="100" markerEnd="url(#sup-arrow)" />
        <line x1="180" y1="60" x2="300" y2="100" markerEnd="url(#sup-arrow)" />
        <line x1="180" y1="60" x2="120" y2="220" markerEnd="url(#sup-arrow)" />
        <line x1="180" y1="60" x2="240" y2="220" markerEnd="url(#sup-arrow)" />
      </g>

      {/* Table cards */}
      <TableCard x={20} y={108} table={TABLES[0]} drawn={drawn} delay={0.4} />
      <TableCard x={140} y={108} table={TABLES[1]} drawn={drawn} delay={0.5} />
      <TableCard x={260} y={108} table={TABLES[2]} drawn={drawn} delay={0.6} />
      <TableCard x={80} y={228} table={TABLES[3]} drawn={drawn} delay={0.7} />
      <TableCard x={200} y={228} table={TABLES[4]} drawn={drawn} delay={0.8} />
    </svg>
  );
}

function TableCard({
  x,
  y,
  table,
  drawn,
  delay,
}: {
  x: number;
  y: number;
  table: (typeof TABLES)[number];
  drawn: boolean;
  delay: number;
}) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      style={{
        opacity: drawn ? 1 : 0,
        transform: `translate(${x}px, ${y + (drawn ? 0 : 8)}px)`,
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
      className="data-card"
    >
      <rect
        width="80"
        height="84"
        rx="3"
        fill="rgba(20,17,13,0.75)"
        stroke="rgba(44,37,25,1)"
        strokeWidth="0.7"
        className="card-rect"
      />
      <text
        x="40"
        y="14"
        textAnchor="middle"
        fontSize="9"
        fill="rgba(244,236,220,0.9)"
        letterSpacing="1.5"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {table.name}
      </text>
      <line
        x1="6"
        y1="22"
        x2="74"
        y2="22"
        stroke="rgba(201,163,114,0.4)"
        strokeWidth="0.5"
      />
      {table.cols.map((c, i) => (
        <text
          key={c}
          x="40"
          y={36 + i * 12}
          textAnchor="middle"
          fontSize="7.5"
          fill="rgba(125,112,96,0.85)"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          {c}
        </text>
      ))}
    </g>
  );
}

function MeshDiagram() {
  const { ref, drawn } = useDrawIn();
  return (
    <svg
      ref={ref}
      viewBox="0 0 360 380"
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      role="img"
      aria-label="Data mesh: five domain islands connected by a federated governance layer"
    >
      <defs>
        <marker
          id="mesh-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(201,163,114,0.5)" />
        </marker>
      </defs>

      {/* Federated governance bar */}
      <g transform="translate(40, 16)">
        <rect
          width="280"
          height="40"
          rx="3"
          fill="rgba(201,163,114,0.07)"
          stroke="rgba(201,163,114,0.55)"
          strokeWidth="0.7"
          strokeDasharray="4 2"
        />
        <text
          x="140"
          y="18"
          textAnchor="middle"
          fontSize="9"
          fill="rgba(232,192,138,0.95)"
          letterSpacing="2.4"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          FEDERATED GOVERNANCE
        </text>
        <text
          x="140"
          y="31"
          textAnchor="middle"
          fontSize="7.5"
          fill="rgba(125,112,96,0.9)"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          contracts · SLAs · discoverability
        </text>
      </g>

      {/* Lines from governance to each domain — federation, not control */}
      <g
        stroke="rgba(201,163,114,0.4)"
        strokeWidth="0.6"
        strokeDasharray="2 2"
        fill="none"
        style={{
          strokeDashoffset: drawn ? 0 : 800,
          transition: "stroke-dashoffset 1.6s ease-out 0.2s",
        }}
      >
        <line x1="180" y1="60" x2="60" y2="105" />
        <line x1="180" y1="60" x2="180" y2="105" />
        <line x1="180" y1="60" x2="300" y2="105" />
        <line x1="180" y1="60" x2="120" y2="245" />
        <line x1="180" y1="60" x2="240" y2="245" />
      </g>

      {/* Cross-domain contracts (faint dashed curves) */}
      <g
        stroke="rgba(201,163,114,0.22)"
        strokeWidth="0.5"
        strokeDasharray="1 3"
        fill="none"
        style={{
          opacity: drawn ? 1 : 0,
          transition: "opacity 1s ease-out 1.2s",
        }}
      >
        {/* Workers ↔ Incidents (employee safety) */}
        <path d="M 60 230 Q 90 245 120 245" markerEnd="url(#mesh-arrow)" />
        {/* Weather ↔ Materials (delivery delays) */}
        <path d="M 300 230 Q 280 245 240 245" markerEnd="url(#mesh-arrow)" />
        {/* Incidents ↔ Photos (evidence attachment) */}
        <path d="M 160 305 Q 180 320 200 305" markerEnd="url(#mesh-arrow)" />
      </g>

      {/* Domain cards */}
      <DomainCard x={20} y={110} domain={DOMAINS[0]} drawn={drawn} delay={0.5} />
      <DomainCard x={140} y={110} domain={DOMAINS[1]} drawn={drawn} delay={0.6} />
      <DomainCard x={260} y={110} domain={DOMAINS[2]} drawn={drawn} delay={0.7} />
      <DomainCard x={80} y={250} domain={DOMAINS[3]} drawn={drawn} delay={0.8} />
      <DomainCard x={200} y={250} domain={DOMAINS[4]} drawn={drawn} delay={0.9} />
    </svg>
  );
}

function DomainCard({
  x,
  y,
  domain,
  drawn,
  delay,
}: {
  x: number;
  y: number;
  domain: (typeof DOMAINS)[number];
  drawn: boolean;
  delay: number;
}) {
  return (
    <g
      style={{
        opacity: drawn ? 1 : 0,
        transform: `translate(${x}px, ${y + (drawn ? 0 : 8)}px)`,
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
      className="data-card"
    >
      <rect
        width="80"
        height="100"
        rx="3"
        fill="rgba(20,17,13,0.75)"
        stroke="rgba(201,163,114,0.35)"
        strokeWidth="0.7"
        className="card-rect"
      />
      {/* Lock + name */}
      <text
        x="9"
        y="15"
        fontSize="8"
        fill="rgba(201,163,114,0.7)"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        ▮
      </text>
      <text
        x="22"
        y="15"
        fontSize="9"
        fill="rgba(244,236,220,0.92)"
        letterSpacing="1.4"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {domain.name}
      </text>
      <text
        x="40"
        y="32"
        textAnchor="middle"
        fontSize="7.5"
        fill="rgba(125,112,96,0.88)"
        letterSpacing="0.8"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {domain.team}
      </text>
      {/* Divider */}
      <line
        x1="6"
        y1="44"
        x2="74"
        y2="44"
        stroke="rgba(201,163,114,0.25)"
        strokeWidth="0.5"
        strokeDasharray="2 2"
      />
      {/* Data product label */}
      <text
        x="40"
        y="62"
        textAnchor="middle"
        fontSize="6.5"
        fill="rgba(232,192,138,0.7)"
        letterSpacing="1"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        DATA PRODUCT
      </text>
      <text
        x="40"
        y="76"
        textAnchor="middle"
        fontSize="7.5"
        fill="rgba(201,163,114,0.85)"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        {domain.product}
      </text>
      <text
        x="40"
        y="89"
        textAnchor="middle"
        fontSize="7"
        fill="rgba(125,112,96,0.75)"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        .parquet
      </text>
    </g>
  );
}
