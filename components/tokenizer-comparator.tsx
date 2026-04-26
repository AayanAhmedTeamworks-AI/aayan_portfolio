"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

const SAMPLE_TEXT =
  "Hallo Welt — making LLMs boring, on purpose. 🌍 const x = `priced`;";

type Model = { id: string; label: string; sublabel: string };

const MODELS: Model[] = [
  { id: "gpt-4o", label: "GPT-4o", sublabel: "o200k_base" },
  { id: "gpt-4", label: "GPT-4 / 3.5", sublabel: "cl100k_base" },
  { id: "llama3", label: "Llama 3", sublabel: "tiktoken-style BPE" },
];

type Encoder = {
  encode: (text: string) => number[];
  decode: (ids: number[]) => string;
};

const encoderCache: Record<string, Encoder> = {};

async function loadEncoder(id: string): Promise<Encoder> {
  if (encoderCache[id]) return encoderCache[id];
  if (id === "gpt-4o") {
    const mod = await import("gpt-tokenizer/encoding/o200k_base");
    const enc: Encoder = {
      encode: (t) => mod.encode(t),
      decode: (ids) => mod.decode(ids),
    };
    encoderCache[id] = enc;
    return enc;
  }
  if (id === "gpt-4") {
    const mod = await import("gpt-tokenizer/encoding/cl100k_base");
    const enc: Encoder = {
      encode: (t) => mod.encode(t),
      decode: (ids) => mod.decode(ids),
    };
    encoderCache[id] = enc;
    return enc;
  }
  if (id === "llama3") {
    const mod = await import("llama3-tokenizer-js");
    const tokenizer = (mod as { default: Encoder }).default;
    const enc: Encoder = {
      encode: (t) => tokenizer.encode(t),
      decode: (ids) => tokenizer.decode(ids),
    };
    encoderCache[id] = enc;
    return enc;
  }
  throw new Error("unknown encoder: " + id);
}

// Earthy chip palette — six muted shades from the codex tokens, indexed
// by stable hash of the token id so the same token always reads the same
// shade across renders.
const PALETTE = [
  "rgba(217, 205, 180, 0.62)",
  "rgba(204, 191, 164, 0.58)",
  "rgba(180, 142, 90, 0.32)",
  "rgba(201, 163, 114, 0.34)",
  "rgba(139, 107, 63, 0.22)",
  "rgba(229, 217, 194, 0.70)",
];

function chipColor(id: number): string {
  return PALETTE[Math.abs(id) % PALETTE.length];
}

/** Visible substitutes for control characters that would otherwise vanish
 *  inside a chip. Spaces stay as spaces — the chip background shows them. */
function display(token: string): string {
  return token.replace(/\n/g, "↵").replace(/\r/g, "").replace(/\t/g, "→");
}

type TokenSet = { ids: number[]; strings: string[] };

export function TokenizerComparator() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const deferredText = useDeferredValue(text);
  const [tokensByModel, setTokensByModel] = useState<
    Record<string, TokenSet | null>
  >({});
  const [errorByModel, setErrorByModel] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const m of MODELS) {
        try {
          const enc = await loadEncoder(m.id);
          if (cancelled) return;
          const ids = enc.encode(deferredText);
          const strings = ids.map((id) => {
            try {
              return enc.decode([id]);
            } catch {
              return "▢";
            }
          });
          if (cancelled) return;
          setTokensByModel((prev) => ({ ...prev, [m.id]: { ids, strings } }));
          setErrorByModel((prev) => ({ ...prev, [m.id]: null }));
        } catch (err) {
          if (cancelled) return;
          setErrorByModel((prev) => ({
            ...prev,
            [m.id]: err instanceof Error ? err.message : String(err),
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deferredText]);

  return (
    <div className="my-12">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-3 block">
          Type or paste — German, English, code, emoji, your own name
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded-lg ring-1 ring-hairline bg-canvas/80 p-5 font-mono text-[13px] text-ink resize-y focus:outline-none focus:ring-2 focus:ring-sepia/40 transition"
          placeholder={SAMPLE_TEXT}
          spellCheck={false}
        />
      </label>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {MODELS.map((m) => {
          const t = tokensByModel[m.id];
          const err = errorByModel[m.id];
          return <Column key={m.id} model={m} tokens={t} error={err} />;
        })}
      </div>

      <p className="mt-12 max-w-[60ch] mx-auto text-center font-serif italic text-mute text-[14px] leading-relaxed">
        Claude and Gemini tokenizers are not published, so they cannot be run
        in the browser. They would slot in here when the labs release them.
        Everything above runs entirely on this page — no network calls, no
        API keys, no telemetry.
      </p>
    </div>
  );
}

function Column({
  model,
  tokens,
  error,
}: {
  model: Model;
  tokens: TokenSet | null;
  error: string | null;
}) {
  const cardStyle: CSSProperties = {
    boxShadow:
      "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)",
  };
  return (
    <div className="rounded-2xl bg-marble/30 ring-1 ring-hairline p-2 h-full">
      <div
        className="rounded-[calc(1rem-6px)] bg-canvas/70 p-6 flex flex-col h-full min-h-[28rem]"
        style={cardStyle}
      >
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-serif text-2xl tracking-[-0.02em] text-ink">
            {model.label}
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
            {model.sublabel}
          </span>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-sepia/85 mb-5">
          {tokens
            ? `${tokens.ids.length} tokens · ${tokens.strings.reduce((n, s) => n + s.length, 0)} chars`
            : error
              ? "error"
              : "loading…"}
        </p>

        {error ? (
          <p className="font-mono text-[11px] text-ink/70 italic">{error}</p>
        ) : tokens ? (
          <div className="flex flex-wrap gap-[3px] leading-relaxed overflow-y-auto pr-1 -mr-1 max-h-[24rem]">
            {tokens.strings.map((s, i) => (
              <span
                key={i}
                title={`id ${tokens.ids[i]}`}
                className="inline-block font-mono text-[12px] px-[5px] py-[1px] rounded text-ink"
                style={{
                  background: chipColor(tokens.ids[i]),
                  whiteSpace: "pre",
                }}
              >
                {display(s) || " "}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[11px] text-mute italic">
            Loading tokenizer…
          </p>
        )}
      </div>
    </div>
  );
}
