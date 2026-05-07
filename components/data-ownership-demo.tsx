/**
 * DataOwnershipDemo — Lab artifact ii. Static side-by-side comparison of
 * a Supabase-style centralised database against a data-mesh-shaped org,
 * focused on the ONE question: who's allowed to change what?
 *
 * Same dataset on both sides — a construction firm's site-report concerns
 * (workers, materials, weather, incidents, photos). Supabase column shows
 * a single platform-team container with all five concerns inside as
 * Postgres tables. Mesh column shows five separate domains, each with its
 * own team and published data product, federated under a thin governance
 * layer.
 *
 * Designer's-eye comparison; trade-offs are summarised in one line. A
 * thesis-in-progress caption asks for the reader's grace on
 * simplifications.
 */

type Table = {
  name: string;
  cols: string[];
};

type Domain = {
  name: string;
  team: string;
  product: string;
};

const TABLES: Table[] = [
  { name: "workers", cols: ["id", "name", "shift_id", "role"] },
  { name: "materials", cols: ["id", "site_id", "qty", "supplier_id"] },
  { name: "weather", cols: ["site_id", "date", "temp", "rain_mm"] },
  { name: "incidents", cols: ["id", "site_id", "category", "severity"] },
  { name: "photos", cols: ["id", "site_id", "url", "taken_at"] },
];

const DOMAINS: Domain[] = [
  { name: "Workers", team: "HR ops", product: "current_shifts.parquet" },
  {
    name: "Materials",
    team: "Procurement",
    product: "consumption.parquet",
  },
  {
    name: "Weather",
    team: "Site ops",
    product: "site_conditions.parquet",
  },
  { name: "Incidents", team: "Safety", product: "safety_log.parquet" },
  { name: "Photos", team: "Field tech", product: "photo_index.parquet" },
];

function PadlockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="7" width="10" height="7" rx="1" />
      <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
    </svg>
  );
}

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
        materials, weather, incidents, photos. Here&apos;s how a
        Supabase-backed central platform differs from a data-mesh-shaped
        org in <em>who</em> can touch what.
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
            Supabase <span className="text-mute">/</span>{" "}
            <span className="italic text-sepia/85">centralised</span>
          </h4>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-mute">
            i. one platform
          </span>
        </header>
        <p className="font-serif italic text-mute text-sm mb-6">
          One platform team holds everything.
        </p>

        <div className="rounded-md ring-1 ring-sepia/40 bg-marble/35 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PadlockIcon className="text-sepia/85" />
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-sepia/85">
              Platform team
            </p>
            <span className="h-px bg-hairline flex-1" />
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-mute">
              postgres + RLS
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TABLES.map((t) => (
              <div
                key={t.name}
                className="rounded ring-1 ring-hairline bg-canvas/70 p-2.5 transition-colors hover:ring-sepia/50"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/90 mb-1">
                  {t.name}
                </p>
                <ul className="space-y-0.5">
                  {t.cols.map((c) => (
                    <li
                      key={c}
                      className="font-mono text-[9.5px] text-mute leading-tight"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-2 font-mono text-[11px] text-ink/80 leading-[1.6]">
          <li>
            <span className="text-sepia/85 mr-2">＋</span>
            one source of truth · simple backups · joins are free
          </li>
          <li>
            <span className="text-sepia/85 mr-2">＋</span>
            RLS gates each row · auth is one decision
          </li>
          <li>
            <span className="text-mute mr-2">－</span>
            add a column → migration touches everyone
          </li>
          <li>
            <span className="text-mute mr-2">－</span>
            schema bottleneck · the platform team is the line
          </li>
        </ul>
      </div>
    </div>
  );
}

function MeshPanel() {
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
            Data mesh <span className="text-mute">/</span>{" "}
            <span className="italic text-sepia/85">federated</span>
          </h4>
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-mute">
            n. domains
          </span>
        </header>
        <p className="font-serif italic text-mute text-sm mb-6">
          Each domain owns its data product.
        </p>

        <div className="space-y-3">
          <div className="rounded-md ring-1 ring-sepia/40 bg-marble/35 px-4 py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-sepia/85">
                Federated governance
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-mute">
                contracts · SLAs · discoverability
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DOMAINS.map((d) => (
              <div
                key={d.name}
                className="rounded ring-1 ring-hairline bg-canvas/70 p-3 transition-colors hover:ring-sepia/50"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/90">
                    {d.name}
                  </p>
                  <PadlockIcon className="text-sepia/70" />
                </div>
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mute mb-2">
                  {d.team}
                </p>
                <p className="font-mono text-[9.5px] text-sepia/75 leading-tight border-t border-hairline pt-2">
                  {d.product}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ul className="mt-6 space-y-2 font-mono text-[11px] text-ink/80 leading-[1.6]">
          <li>
            <span className="text-sepia/85 mr-2">＋</span>
            domain autonomy · changes don&apos;t cascade · scales with org
          </li>
          <li>
            <span className="text-sepia/85 mr-2">＋</span>
            heterogeneous shapes (transactional, time-series, blobs) live
            natively
          </li>
          <li>
            <span className="text-mute mr-2">－</span>
            cross-domain joins are contracts, not native SQL
          </li>
          <li>
            <span className="text-mute mr-2">－</span>
            governance overhead · requires data-as-a-product mindset
          </li>
        </ul>
      </div>
    </div>
  );
}
