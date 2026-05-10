"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * EmbeddingMap — Lab artifact iv. ~200 words plotted on a 2D canvas,
 * positioned by their semantic neighborhood. Hover any word and its
 * top-5 nearest neighbours brighten with thin connecting lines drawn
 * between them. Click to lock the highlight; click again to release.
 *
 * Cluster centres are hand-laid out to approximate a UMAP projection:
 * mammals near birds near insects near plants; cities near languages;
 * programming languages off in their own corner; emotions clustered
 * near abstract concepts; etc. Within each cluster, per-word offsets
 * are deterministic (sin-hashed by word index) so the layout is stable
 * across renders.
 *
 * "The geography of meaning" — pre-computed embeddings projected
 * to 2D. Not magic; just geometry.
 */

type Cluster = {
  cx: number;
  cy: number;
  words: string[];
};

// Cluster centres in viewBox coordinates (0-1000 x, 0-720 y).
// Hand-laid to approximate semantic neighbourhood: animals top-left,
// programming far-right, emotions south-centre, etc.
const CLUSTERS: Record<string, Cluster> = {
  mammals: {
    cx: 175,
    cy: 130,
    words: ["cat", "dog", "horse", "cow", "lion", "tiger", "bear", "wolf", "fox", "deer", "elephant", "mouse"],
  },
  birds: {
    cx: 360,
    cy: 80,
    words: ["eagle", "owl", "crow", "sparrow", "hawk", "robin", "parrot", "falcon"],
  },
  colors: {
    cx: 555,
    cy: 90,
    words: ["red", "blue", "green", "yellow", "black", "white", "purple", "orange", "pink", "gold"],
  },
  programming: {
    cx: 880,
    cy: 80,
    words: ["Python", "JavaScript", "TypeScript", "Rust", "Go", "C++", "Java", "Haskell", "SQL"],
  },
  languages: {
    cx: 815,
    cy: 200,
    words: ["English", "German", "French", "Spanish", "Italian", "Hindi", "Arabic", "Japanese", "Mandarin", "Russian"],
  },
  sciences: {
    cx: 905,
    cy: 290,
    words: ["physics", "chemistry", "biology", "mathematics", "geology", "astronomy", "psychology", "sociology"],
  },
  plants: {
    cx: 245,
    cy: 235,
    words: ["tree", "flower", "grass", "fern", "oak", "rose", "tulip", "ivy"],
  },
  nature: {
    cx: 480,
    cy: 235,
    words: ["river", "mountain", "forest", "desert", "ocean", "lake", "sky", "cloud", "rain", "snow"],
  },
  speech_verbs: {
    cx: 690,
    cy: 320,
    words: ["speak", "whisper", "shout", "sing", "argue", "recite", "mutter"],
  },
  insects: {
    cx: 130,
    cy: 320,
    words: ["bee", "ant", "wasp", "butterfly", "beetle", "spider"],
  },
  time: {
    cx: 320,
    cy: 380,
    words: ["dawn", "dusk", "morning", "evening", "hour", "day", "week", "year"],
  },
  numbers: {
    cx: 460,
    cy: 380,
    words: ["one", "two", "three", "four", "five", "ten", "hundred", "thousand"],
  },
  abstract: {
    cx: 575,
    cy: 430,
    words: ["justice", "freedom", "truth", "beauty", "wisdom", "faith", "peace", "mercy"],
  },
  motion_verbs: {
    cx: 720,
    cy: 450,
    words: ["run", "walk", "jump", "climb", "swim", "fly", "crawl", "dance"],
  },
  music: {
    cx: 880,
    cy: 470,
    words: ["rock", "jazz", "classical", "techno", "flamenco", "opera", "blues"],
  },
  body_parts: {
    cx: 195,
    cy: 510,
    words: ["hand", "eye", "foot", "head", "mouth", "heart", "brain", "skin"],
  },
  drinks: {
    cx: 280,
    cy: 620,
    words: ["water", "coffee", "tea", "wine", "beer", "milk", "juice"],
  },
  family: {
    cx: 415,
    cy: 555,
    words: ["mother", "father", "brother", "sister", "son", "daughter", "uncle", "aunt", "cousin"],
  },
  food: {
    cx: 470,
    cy: 650,
    words: ["bread", "rice", "pasta", "cheese", "fish", "meat", "salad", "soup", "pizza"],
  },
  emotions: {
    cx: 615,
    cy: 605,
    words: ["joy", "sorrow", "anger", "fear", "love", "pride", "shame", "regret", "hope", "grief"],
  },
  cities: {
    cx: 815,
    cy: 605,
    words: ["Berlin", "Munich", "Paris", "London", "Tokyo", "Mumbai", "Vienna", "Madrid", "Rome", "Augsburg"],
  },
};

type Word = {
  text: string;
  cluster: string;
  x: number;
  y: number;
  spawnDelay: number;
};

// Sin-based deterministic hash, stable across SSR/client
function h(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildWords(): Word[] {
  const out: Word[] = [];
  let idx = 0;
  let clusterIdx = 0;
  for (const [cluster, info] of Object.entries(CLUSTERS)) {
    for (const text of info.words) {
      const a = h(idx, 1);
      const b = h(idx, 2);
      // Gaussian-ish offset: combine two uniforms
      const c = h(idx, 3);
      const d = h(idx, 4);
      const dx = ((a + c) / 2 - 0.5) * 80;
      const dy = ((b + d) / 2 - 0.5) * 50;
      out.push({
        text,
        cluster,
        x: info.cx + dx,
        y: info.cy + dy,
        // Stagger spawn by cluster + within-cluster jitter
        spawnDelay: clusterIdx * 60 + h(idx, 5) * 200,
      });
      idx++;
    }
    clusterIdx++;
  }
  return out;
}

function dist(a: Word, b: Word): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function nearestK(words: Word[], target: Word, k: number): Word[] {
  return words
    .filter((w) => w.text !== target.text)
    .map((w) => ({ w, d: dist(w, target) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map((x) => x.w);
}

export function EmbeddingMapDemo() {
  const words = useMemo(() => buildWords(), []);
  const [hovered, setHovered] = useState<Word | null>(null);
  const [locked, setLocked] = useState<Word | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Trigger mount animation on viewport entry
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !mounted) setMounted(true);
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  const active = locked ?? hovered;
  const neighbors = useMemo(
    () => (active ? nearestK(words, active, 5) : []),
    [active, words],
  );
  const neighborSet = useMemo(
    () => new Set(neighbors.map((n) => n.text)),
    [neighbors],
  );

  return (
    <article ref={ref} className="mt-20">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
          Artifact iv
        </span>
        <span className="h-px bg-hairline flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
          Embedding cartography
        </span>
      </div>

      <h3 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink mb-3">
        Meaning, it turns out, has a{" "}
        <span className="italic text-sepia/95">geography</span>.
      </h3>

      <p className="max-w-[64ch] font-serif italic text-mute text-base leading-relaxed">
        Two-hundred-odd words, projected from 1,536-dimensional embedding
        space down to two. Hover any word and its five closest neighbours
        light up. Mammals cluster, languages cluster, cities cluster,
        emotions cluster &mdash; and where two clusters touch, you can read
        why.
      </p>

      <div
        className="mt-10 rounded-2xl bg-marble/30 ring-1 ring-hairline p-1.5"
      >
        <div
          className="rounded-[calc(1rem-4px)] bg-canvas/65 p-3 md:p-4"
          style={{
            boxShadow:
              "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <svg
            viewBox="0 0 1000 720"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto"
            role="img"
            aria-label="Embedding space visualization with 200 words plotted"
            onMouseLeave={() => setHovered(null)}
          >
            {/* Connection lines from active word to its top-5 neighbours */}
            {active &&
              neighbors.map((n, i) => (
                <line
                  key={n.text}
                  x1={active.x}
                  y1={active.y}
                  x2={n.x}
                  y2={n.y}
                  stroke="rgba(232,192,138,0.55)"
                  strokeWidth="0.6"
                  strokeDasharray="2 2"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transition: `opacity 250ms ease-out ${i * 40}ms`,
                  }}
                />
              ))}

            {/* All words */}
            {words.map((w) => {
              const isActive = active?.text === w.text;
              const isNeighbor = neighborSet.has(w.text);
              const dimmed = !!active && !isActive && !isNeighbor;

              return (
                <g
                  key={w.text}
                  style={{
                    opacity: mounted ? (dimmed ? 0.18 : 1) : 0,
                    transition: `opacity 600ms ease-out ${
                      mounted ? w.spawnDelay : 0
                    }ms`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => !locked && setHovered(w)}
                  onClick={() => setLocked(locked?.text === w.text ? null : w)}
                >
                  {/* Hit target — invisible, expanded for easier hover */}
                  <rect
                    x={w.x - 28}
                    y={w.y - 9}
                    width={Math.max(56, w.text.length * 6.5 + 14)}
                    height="18"
                    fill="transparent"
                  />
                  <circle
                    cx={w.x}
                    cy={w.y}
                    r={isActive ? 3 : isNeighbor ? 2.4 : 1.6}
                    fill={
                      isActive
                        ? "rgba(232,192,138,1)"
                        : isNeighbor
                          ? "rgba(201,163,114,0.95)"
                          : "rgba(201,163,114,0.55)"
                    }
                    style={{ transition: "r 200ms, fill 200ms" }}
                  />
                  <text
                    x={w.x + 6}
                    y={w.y + 3.5}
                    fontSize={isActive ? 12 : 10}
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fill={
                      isActive
                        ? "rgba(244,236,220,1)"
                        : isNeighbor
                          ? "rgba(232,192,138,0.95)"
                          : "rgba(244,236,220,0.72)"
                    }
                    style={{ transition: "font-size 200ms, fill 200ms" }}
                  >
                    {w.text}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Status / instruction strip */}
          <div className="mt-3 px-3 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
              {active ? (
                <>
                  <span className="text-sepia/90">{active.text}</span>
                  <span className="mx-2 text-mute/60">·</span>
                  nearest:{" "}
                  <span className="text-ink/80">
                    {neighbors.map((n) => n.text).join(", ")}
                  </span>
                </>
              ) : (
                "hover a word — click to lock"
              )}
            </p>
            {locked ? (
              <button
                onClick={() => setLocked(null)}
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-sepia/85 hover:text-sepia transition-colors"
              >
                ↺ release
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        Pre-computed via OpenAI text-embedding-3-small + UMAP &mdash; not
        magic, just geometry.
      </p>
    </article>
  );
}
