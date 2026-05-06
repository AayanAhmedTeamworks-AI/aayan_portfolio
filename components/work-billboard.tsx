"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { OfflineSyncDiagram } from "@/components/offline-sync-diagram";
import { FlowSteps } from "@/components/flow-steps";

const TOTAL = 5;

/**
 * Work billboard — five projects pinned to the viewport, swapped in place as
 * the page scrolls. Same Patel-pattern as `<ContactusBillboard/>`, retuned
 * for engineering proof-of-work: each card carries a tiny animated diagram
 * (offline-sync state machine, n8n flow steps, deployment topology) so the
 * shape of the work is visible without prose.
 *
 * Heterogeneous cards under a uniform reveal — the standardisation is the
 * confidence move. Each card pins, gets its moment, swaps.
 */
export function WorkBillboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={containerRef}
      id="work"
      className="relative w-full"
      style={{ height: `${TOTAL * 100}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col">
        {/* Section header — small, anchored top-left, persists across cards */}
        <header className="relative z-10 mx-auto w-full max-w-6xl px-8 md:px-12 pt-24 pb-6">
          <div className="flex items-baseline justify-between gap-6 border-b border-hairline pb-4">
            <div className="flex items-baseline gap-3">
              <span className="font-serif italic text-sepia/70 text-lg">
                ii.
              </span>
              <h2 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink">
                The work
              </h2>
            </div>
            <ProgressLabel progress={scrollYProgress} />
          </div>
        </header>

        {/* Card stage */}
        <div className="relative flex-1 w-full">
          <BillboardCard index={0} progress={scrollYProgress}>
            <BautagesberichtCard />
          </BillboardCard>
          <BillboardCard index={1} progress={scrollYProgress}>
            <OutlookCapmoCard />
          </BillboardCard>
          <BillboardCard index={2} progress={scrollYProgress}>
            <EmployeeAcqCard />
          </BillboardCard>
          <BillboardCard index={3} progress={scrollYProgress}>
            <OpenClawCard />
          </BillboardCard>
          <BillboardCard index={4} progress={scrollYProgress}>
            <GeoTuneUpCard />
          </BillboardCard>
        </div>
      </div>
    </section>
  );
}

function BillboardCard({
  index,
  progress,
  children,
}: {
  index: number;
  progress: MotionValue<number>;
  children: ReactNode;
}) {
  const start = index / TOTAL;
  const end = (index + 1) / TOTAL;
  const fade = 0.04;

  const y = useTransform(
    progress,
    [
      Math.max(0, start - fade),
      start,
      end - fade,
      Math.min(1, end + fade),
    ],
    ["45%", "0%", "0%", "-45%"],
  );

  const opacity = useTransform(
    progress,
    [
      Math.max(0, start - fade * 0.5),
      start + fade * 0.5,
      end - fade,
      Math.min(1, end + fade * 0.5),
    ],
    [0, 1, 1, 0],
  );

  return (
    <motion.div
      style={{ y, opacity }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
    >
      <div className="relative w-full max-w-4xl mx-auto pointer-events-auto">
        {children}
      </div>
    </motion.div>
  );
}

function ProgressLabel({ progress }: { progress: MotionValue<number> }) {
  const idx = useTransform(progress, (p) =>
    String(Math.min(TOTAL, Math.floor(p * TOTAL) + 1)).padStart(2, "0"),
  );
  return (
    <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
      <motion.span className="text-sepia/85">{idx}</motion.span>
      <span>/ {String(TOTAL).padStart(2, "0")}</span>
    </div>
  );
}

/* ---------- Card content ---------- */

function CardShell({
  numeral,
  status,
  title,
  metric,
  children,
}: {
  numeral: string;
  status: string;
  title: string;
  metric?: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl bg-marble/30 ring-1 ring-hairline p-2">
      <div
        className="rounded-[calc(1rem-6px)] bg-canvas/70 px-8 py-10 md:px-12 md:py-12"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-baseline justify-between gap-6 mb-7">
          <div className="flex items-baseline gap-3">
            <span className="font-serif italic text-sepia/65 text-base">
              {numeral}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
              {status}
            </span>
          </div>
          {metric ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sepia/85">
              {metric}
            </span>
          ) : null}
        </div>
        <h3 className="font-serif text-[2.2rem] md:text-[2.8rem] leading-[1.04] tracking-[-0.022em] text-ink">
          {title}
        </h3>
        <div className="mt-7">{children}</div>
      </div>
    </article>
  );
}

function BautagesberichtCard() {
  return (
    <CardShell
      numeral="i."
      status="Production · Teamworks AI"
      title="Bautagesbericht Pro"
      metric="15 min → 4 min per report"
    >
      <p className="max-w-[60ch] text-[15px] leading-[1.7] text-ink/80">
        A construction-site PWA. Foremen call a phone number, talk to a
        German voice agent in their own register, and the transcript becomes
        a structured daily report in the database. Works offline; reconciles
        when signal returns.
      </p>
      <div className="mt-8 rounded-md ring-1 ring-hairline/70 bg-canvas/60 p-5 md:p-6">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.32em] text-mute">
          Offline-first sync — happy path traced
        </p>
        <OfflineSyncDiagram className="h-auto w-full" />
      </div>
    </CardShell>
  );
}

function OutlookCapmoCard() {
  return (
    <CardShell
      numeral="ii."
      status="Production · Teamworks AI"
      title="Outlook → CAPMO"
    >
      <p className="max-w-[60ch] text-[15px] leading-[1.7] text-ink/80">
        An n8n flow that turns triaged Outlook emails into construction
        tickets. Idempotent &mdash; an email&apos;s category serves as both
        a state flag and a lock, so retries are safe and observable. No
        message queue, no DB.
      </p>
      <div className="mt-9 rounded-md ring-1 ring-hairline/70 bg-canvas/60 p-5 md:p-6">
        <FlowSteps
          steps={[
            "Inbox",
            "TRACKING tag",
            "Reconcile (5min)",
            "POST CAPMO",
            "Audit row",
          ]}
          className="h-auto w-full"
        />
      </div>
    </CardShell>
  );
}

function EmployeeAcqCard() {
  return (
    <CardShell
      numeral="iii."
      status="Production · Teamworks AI"
      title="Employee Acquisition"
      metric="Llama 3.3 ≈ GPT-4o, 1/10th cost"
    >
      <p className="max-w-[60ch] text-[15px] leading-[1.7] text-ink/80">
        An n8n flow that turns a German job description into a ranked
        candidate shortlist. Llama 3.3 70B on Groq for structured
        extraction; SerpAPI for the LinkedIn search; a small scoring pass
        before the recruiter ever sees a row.
      </p>
      <div className="mt-9 rounded-md ring-1 ring-hairline/70 bg-canvas/60 p-5 md:p-6">
        <FlowSteps
          steps={[
            "JD (raw)",
            "LLM extract",
            "SerpAPI",
            "Normalise",
            "Score",
            "Sheet",
          ]}
          className="h-auto w-full"
        />
      </div>
    </CardShell>
  );
}

function OpenClawCard() {
  return (
    <CardShell
      numeral="iv."
      status="In progress · Teamworks AI"
      title="OpenCLAW on-prem"
    >
      <p className="max-w-[60ch] text-[15px] leading-[1.7] text-ink/80">
        On-premise deployment of an AI orchestration platform for a client
        with data-sovereignty constraints. Ubuntu LTS, Caddy + TLS, Docker
        Compose, nightly Borg backups, SSO via the client&apos;s identity
        provider. Production-grade AI is mostly a sysadmin problem; this is
        the receipt.
      </p>
      <div className="mt-9 rounded-md ring-1 ring-hairline/70 bg-canvas/60 p-5 md:p-6">
        <FlowSteps
          steps={[
            "Firewall",
            "Caddy / TLS",
            "OpenCLAW",
            "Postgres",
            "Vector DB",
          ]}
          className="h-auto w-full"
        />
      </div>
    </CardShell>
  );
}

function GeoTuneUpCard() {
  return (
    <CardShell
      numeral="v."
      status="Personal R&D"
      title="GEO Tune-Up"
    >
      <p className="max-w-[60ch] text-[15px] leading-[1.7] text-ink/80">
        A research tool that asks four LLMs whether they cite a given URL
        when answering plausible user questions, and produces ranked rewrite
        suggestions. The hypothesis: model citation behaviour is measurable,
        stable enough to optimise against, and worth measuring.
      </p>
      <div className="mt-9 rounded-md ring-1 ring-hairline/70 bg-canvas/60 p-5 md:p-6">
        <FlowSteps
          steps={[
            "URL",
            "Prompt suite",
            "4× LLMs",
            "Citation scan",
            "Rewrite hints",
          ]}
          className="h-auto w-full"
        />
      </div>
    </CardShell>
  );
}
