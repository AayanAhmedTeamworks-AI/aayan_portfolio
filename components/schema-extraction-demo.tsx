"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SchemaExtractionDemo — Lab artifact iii. Watch a foreman's phone-call
 * transcript become a structured database row. The drama is the
 * contract holding: each extracted field is type-checked against the
 * JSON Schema; the wetter field deliberately fails first ("ca. 14"
 * isn't a number), retries, and recovers. Schema-as-contract, made
 * visible.
 *
 * Pre-baked, no live LLM. The timing is real — typing-speed transcript
 * + per-field fill durations + a retry pause that reads as a real
 * validation gate. IntersectionObserver gates the animation so it
 * starts when the artifact enters view; replay button restarts.
 */

const TRANSCRIPT =
  "OK, also heute der dritte Mai. Baustelle: Gebäude 3, Bauteil B. Mannschaft heute vier Mann — Müller, Schmidt, Yilmaz und Kowalski. Wetter war trocken, etwa 14 Grad, kein Regen. Wir haben Beton auf die Decke gegossen wie geplant. Materiallieferung war zwei Stunden zu spät. Mischer-Getriebe defekt, 30 Minuten verloren. Yilmaz hat sich den Rücken verzogen, geht früher heim. Morgen: Beton fertigmachen, nächste Lieferung planen, Safety-Follow-up Yilmaz.";

const TYPING_SPEED = 38; // chars per second
const TYPING_TIME_MS = (TRANSCRIPT.length * 1000) / TYPING_SPEED;
const TAIL_BUFFER_MS = 2200;
const TOTAL_MS = TYPING_TIME_MS + TAIL_BUFFER_MS;

type Field = {
  key: string;
  type: string;
  trigger: number;
  fillMs: number;
  value: string;
  retry?: { wrongValue: string; reason: string; retryMs: number };
};

const FIELDS: Field[] = [
  {
    key: "datum",
    type: "date",
    trigger: 30,
    fillMs: 600,
    value: '"2026-05-03"',
  },
  {
    key: "baustelle",
    type: "string",
    trigger: 63,
    fillMs: 700,
    value: '"Gebäude 3, Bauteil B"',
  },
  {
    key: "personal",
    type: "string[]",
    trigger: 129,
    fillMs: 900,
    value: '["Müller", "Schmidt", "Yilmaz", "Kowalski"]',
  },
  {
    key: "wetter",
    type: "{ temp: number, rain: boolean }",
    trigger: 175,
    fillMs: 750,
    value: '{ "temp": 14, "rain": false }',
    retry: {
      wrongValue: '{ "temp": "ca. 14", "rain": false }',
      reason: "expected number, got string",
      retryMs: 1300,
    },
  },
  {
    key: "arbeiten",
    type: "string[]",
    trigger: 226,
    fillMs: 950,
    value: '["Beton-Guss auf Decke"]',
  },
  {
    key: "besonderheiten",
    type: "{ kategorie, beschreibung }[]",
    trigger: 369,
    fillMs: 1500,
    value:
      '[\n  { kategorie: "delay",\n    beschreibung: "Material 2h verspätet" },\n  { kategorie: "delay",\n    beschreibung: "Mischer: 30min verloren" },\n  { kategorie: "accident",\n    beschreibung: "Yilmaz: Rücken" }\n]',
  },
  {
    key: "todos",
    type: "string[]",
    trigger: 447,
    fillMs: 1200,
    value:
      '[\n  "Beton-Guss fertigstellen",\n  "nächste Materiallieferung planen",\n  "Safety-Follow-up Yilmaz"\n]',
  },
];

type Status = "empty" | "filling" | "retry" | "valid";

type State = {
  status: Status;
  shown: string;
  showStrike: boolean;
  reason: string | null;
};

function fieldState(field: Field, time: number): State {
  const triggerMs = (field.trigger / TYPING_SPEED) * 1000;
  if (time < triggerMs) {
    return { status: "empty", shown: "", showStrike: false, reason: null };
  }
  const since = time - triggerMs;
  if (since < field.fillMs) {
    return { status: "filling", shown: "", showStrike: false, reason: null };
  }
  if (field.retry) {
    const totalRetry = field.fillMs + field.retry.retryMs;
    if (since < totalRetry) {
      return {
        status: "retry",
        shown: field.retry.wrongValue,
        showStrike: true,
        reason: field.retry.reason,
      };
    }
  }
  return {
    status: "valid",
    shown: field.value,
    showStrike: !!field.retry,
    reason: null,
  };
}

export function SchemaExtractionDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [seenInView, setSeenInView] = useState(false);

  // Start animation when the artifact enters view (once)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenInView) {
            setSeenInView(true);
            setRunning(true);
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seenInView]);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - time;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      if (elapsed >= TOTAL_MS) {
        setTime(TOTAL_MS);
        setRunning(false);
        return;
      }
      setTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const replay = () => {
    setTime(0);
    setRunning(true);
  };

  const transcriptShown = TRANSCRIPT.slice(
    0,
    Math.min(
      TRANSCRIPT.length,
      Math.floor((time / 1000) * TYPING_SPEED),
    ),
  );
  const isTyping = time < TYPING_TIME_MS;

  return (
    <article ref={ref} className="mt-20">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
          Artifact iii
        </span>
        <span className="h-px bg-hairline flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
          Schema as contract
        </span>
      </div>

      <h3 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink mb-3">
        Watch a phone call become a database row.
      </h3>

      <p className="max-w-[64ch] font-serif italic text-mute text-base leading-relaxed">
        A foreman calls in the day&apos;s site report. The transcript
        comes back messy, German, half-thought-through. A strict JSON
        schema is the only thing keeping the row honest &mdash; one field
        fails validation on first attempt, retries, then lands. The same
        pattern that runs in production for our German construction-industry
        clients.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TranscriptPanel transcript={transcriptShown} typing={isTyping} />
        <SchemaPanel time={time} />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={replay}
          disabled={running}
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85 hover:text-sepia disabled:text-mute disabled:hover:text-mute transition-colors"
        >
          ↻ Replay
        </button>
        <span className="h-px bg-hairline flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
          Pre-baked · no live LLM call
        </span>
      </div>
    </article>
  );
}

function TranscriptPanel({
  transcript,
  typing,
}: {
  transcript: string;
  typing: boolean;
}) {
  return (
    <div className="rounded-2xl bg-marble/30 ring-1 ring-hairline p-1.5">
      <div
        className="rounded-[calc(1rem-4px)] bg-canvas/65 px-5 py-6 md:px-6 md:py-7 min-h-[20rem]"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <header className="flex items-baseline justify-between mb-1">
          <h4 className="font-serif text-lg tracking-tight text-ink">
            Foreman call
          </h4>
          <div className="flex items-baseline gap-2">
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (typing ? "bg-sepia animate-pulse" : "bg-mute/50")
              }
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute">
              {typing ? "live · de-DE" : "ended"}
            </span>
          </div>
        </header>
        <p className="font-serif italic text-mute text-sm mb-5">
          fonio.ai webhook payload &mdash; raw transcript
        </p>

        <p className="font-mono text-[12px] leading-[1.7] text-ink/85 whitespace-pre-wrap">
          {transcript}
          {typing ? (
            <span className="inline-block w-[6px] h-[14px] bg-sepia/85 align-middle ml-0.5 animate-pulse" />
          ) : null}
        </p>
      </div>
    </div>
  );
}

function SchemaPanel({ time }: { time: number }) {
  return (
    <div className="rounded-2xl bg-marble/30 ring-1 ring-hairline p-1.5">
      <div
        className="rounded-[calc(1rem-4px)] bg-canvas/65 px-5 py-6 md:px-6 md:py-7 min-h-[20rem]"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <header className="flex items-baseline justify-between mb-1">
          <h4 className="font-serif text-lg tracking-tight text-ink">
            Schema · extracted row
          </h4>
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute">
            zod / json-schema
          </span>
        </header>
        <p className="font-serif italic text-mute text-sm mb-5">
          openai · structured output, validated at the boundary
        </p>

        <div className="space-y-3">
          {FIELDS.map((f) => {
            const s = fieldState(f, time);
            return <FieldRow key={f.key} field={f} state={s} />;
          })}
        </div>
      </div>
    </div>
  );
}

function FieldRow({ field, state }: { field: Field; state: State }) {
  const isMulti = field.value.includes("\n");

  return (
    <div className="border-l-2 border-hairline pl-3 transition-colors duration-300"
      style={{
        borderColor:
          state.status === "valid"
            ? "rgba(201, 163, 114, 0.6)"
            : state.status === "retry"
              ? "rgba(232, 138, 84, 0.7)"
              : state.status === "filling"
                ? "rgba(201, 163, 114, 0.3)"
                : "rgba(44, 37, 25, 1)",
      }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-ink/95">{field.key}</span>
        <span className="font-mono text-[10px] text-mute">{field.type}</span>
        <span className="flex-1" />
        <StatusBadge status={state.status} />
      </div>

      {state.status === "filling" ? (
        <p className="font-mono text-[10.5px] text-mute mt-1 italic">
          extracting…
        </p>
      ) : state.status === "empty" ? null : (
        <div className="mt-1">
          {state.showStrike && state.status === "retry" ? (
            <p className="font-mono text-[10.5px] text-[#e88a54]/85 line-through decoration-[#e88a54]/60">
              {state.shown}
            </p>
          ) : state.status === "retry" ? null : (
            <>
              {state.showStrike ? (
                <p className="font-mono text-[10px] text-mute/65 line-through decoration-mute/40 mb-0.5">
                  {field.retry?.wrongValue}
                </p>
              ) : null}
              <p
                className={
                  "font-mono text-ink/85 whitespace-pre-wrap break-words " +
                  (isMulti ? "text-[10px] leading-[1.55]" : "text-[10.5px]")
                }
              >
                {state.shown}
              </p>
            </>
          )}
          {state.reason ? (
            <p className="font-mono text-[9.5px] text-[#e88a54]/85 mt-0.5 italic">
              schema check: {state.reason} → retry
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "empty") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-mute/40">
        ─
      </span>
    );
  }
  if (status === "filling") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-sepia/70">
        ⏳ filling
      </span>
    );
  }
  if (status === "retry") {
    return (
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#e88a54]">
        ↻ retry
      </span>
    );
  }
  return (
    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-sepia">
      ✓ valid
    </span>
  );
}
