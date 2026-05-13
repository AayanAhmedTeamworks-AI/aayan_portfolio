"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * EmbeddingMap — Lab artifact iv.
 *
 * A hand-laid atlas of ~115 words, organised into 21 labelled
 * territories that approximate what a UMAP projection of a real text
 * embedding would look like. Hover any word and its top-5 nearest
 * neighbours light up with thin curved lines drawn between them; click
 * to lock the highlight, click ↺ release to clear.
 *
 * Aesthetic: serif italic region labels at each cluster's centre, soft
 * sepia halos as territory, monospace word names as place markers
 * orbiting their region label on an ellipse. Word positions are
 * deterministic (index-based angle + sin-hashed jitter) so the layout
 * is stable across SSR/CSR.
 */

type Cluster = {
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  words: string[];
};

const CLUSTERS: Record<string, Cluster> = {
  mammals: { cx: 155, cy: 117, rx: 70, ry: 42, label: "Mammals", words: ["cat", "wolf", "bear", "tiger", "fox", "deer"] },
  birds: { cx: 320, cy: 62, rx: 65, ry: 38, label: "Birds", words: ["eagle", "owl", "sparrow", "falcon", "robin"] },
  insects: { cx: 95, cy: 232, rx: 60, ry: 36, label: "Insects", words: ["bee", "ant", "moth", "beetle", "spider"] },
  plants: { cx: 252, cy: 222, rx: 65, ry: 40, label: "Plants", words: ["oak", "rose", "fern", "ivy", "tulip"] },
  nature: { cx: 422, cy: 170, rx: 75, ry: 44, label: "Landscape", words: ["river", "mountain", "forest", "ocean", "desert"] },
  colors: { cx: 547, cy: 78, rx: 70, ry: 40, label: "Colors", words: ["red", "blue", "gold", "black", "purple", "green"] },
  languages: { cx: 685, cy: 110, rx: 75, ry: 44, label: "Languages", words: ["English", "German", "French", "Hindi", "Mandarin", "Arabic"] },
  programming: { cx: 880, cy: 80, rx: 70, ry: 40, label: "Code", words: ["Python", "Rust", "Haskell", "Java", "SQL"] },
  sciences: { cx: 920, cy: 212, rx: 70, ry: 42, label: "Sciences", words: ["physics", "biology", "math", "astronomy", "chemistry"] },
  music: { cx: 855, cy: 322, rx: 65, ry: 40, label: "Music", words: ["jazz", "classical", "techno", "opera", "blues"] },
  abstract: { cx: 640, cy: 240, rx: 70, ry: 42, label: "Concepts", words: ["justice", "freedom", "truth", "beauty", "faith"] },
  time: { cx: 210, cy: 350, rx: 65, ry: 40, label: "Time", words: ["dawn", "dusk", "morning", "evening", "hour", "year"] },
  numbers: { cx: 375, cy: 350, rx: 65, ry: 40, label: "Numbers", words: ["one", "two", "three", "ten", "hundred", "thousand"] },
  speech_verbs: { cx: 515, cy: 375, rx: 65, ry: 40, label: "Speech", words: ["speak", "whisper", "shout", "sing", "mutter"] },
  motion_verbs: { cx: 675, cy: 375, rx: 65, ry: 40, label: "Motion", words: ["run", "walk", "jump", "swim", "fly", "dance"] },
  body_parts: { cx: 130, cy: 452, rx: 65, ry: 40, label: "Body", words: ["hand", "eye", "head", "heart", "brain"] },
  family: { cx: 295, cy: 482, rx: 70, ry: 42, label: "Family", words: ["mother", "father", "brother", "sister", "daughter"] },
  emotions: { cx: 450, cy: 518, rx: 70, ry: 44, label: "Feeling", words: ["joy", "anger", "fear", "love", "sorrow", "hope"] },
  food: { cx: 595, cy: 518, rx: 65, ry: 40, label: "Food", words: ["bread", "rice", "cheese", "meat", "pasta"] },
  drinks: { cx: 750, cy: 482, rx: 65, ry: 40, label: "Drinks", words: ["coffee", "tea", "wine", "water", "beer"] },
  cities: { cx: 895, cy: 452, rx: 70, ry: 42, label: "Cities", words: ["Berlin", "Paris", "London", "Tokyo", "Mumbai", "Rome"] },
};

type Word = {
  text: string;
  cluster: string;
  clusterLabel: string;
  x: number;
  y: number;
  spawnDelay: number;
};

// Sin-based deterministic hash, stable across SSR/client.
function h(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildWords(): Word[] {
  const out: Word[] = [];
  let idx = 0;
  let clusterIdx = 0;
  for (const [cluster, info] of Object.entries(CLUSTERS)) {
    const n = info.words.length;
    // Random rotation per cluster so word "0" isn't always at the same angle.
    const phase = h(clusterIdx, 9) * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const text = info.words[i];
      const baseAngle = phase + (i / n) * Math.PI * 2 + (h(idx, 1) - 0.5) * 0.4;
      const rFactor = 0.86 + h(idx, 2) * 0.18;
      const wrx = info.rx * 0.78 * rFactor;
      const wry = info.ry * 0.78 * rFactor;
      out.push({
        text,
        cluster,
        clusterLabel: info.label,
        x: info.cx + Math.cos(baseAngle) * wrx,
        y: info.cy + Math.sin(baseAngle) * wry,
        spawnDelay: clusterIdx * 42 + i * 14,
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

// Quadratic Bezier with a small perpendicular bow — surveyor's curve,
// not a straight line. Reads more like an inked drawing.
function curvedPath(ax: number, ay: number, bx: number, by: number): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const off = Math.min(len * 0.10, 14);
  const px = (-dy / len) * off;
  const py = (dx / len) * off;
  return `M ${ax} ${ay} Q ${mx + px} ${my + py} ${bx} ${by}`;
}

export function EmbeddingMapDemo() {
  const words = useMemo(() => buildWords(), []);
  const [hovered, setHovered] = useState<Word | null>(null);
  const [locked, setLocked] = useState<Word | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !mounted) setMounted(true);
        }
      },
      { threshold: 0.15 },
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
  const activeCluster = active?.cluster;

  return (
    <article ref={ref} className="mt-20">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
          Artifact iv
        </span>
        <span className="h-px bg-hairline flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
          An atlas of meaning
        </span>
      </div>

      <h3 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink mb-3">
        Meaning, it turns out, has a{" "}
        <span className="italic text-sepia/95">geography</span>.
      </h3>

      <p className="max-w-[64ch] font-serif italic text-mute text-base leading-relaxed">
        A hundred-odd words, each placed where its meaning lives. Hover
        any word and its five closest neighbours light up. Mammals lean
        toward insects, emotions toward the body &mdash; and where two
        regions touch, you can read why.
      </p>

      <div className="mt-10 rounded-2xl ring-1 ring-hairline bg-marble/40 p-1.5">
        <div
          className="rounded-[calc(1rem-4px)] p-3 md:p-4"
          style={{
            background:
              "radial-gradient(140% 100% at 50% 0%, rgba(28,22,14,0.94), rgba(8,6,3,0.985) 75%)",
            boxShadow:
              "inset 0 0 90px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-auto"
            role="img"
            aria-label="Embedding map: ~115 words plotted across 21 labelled semantic territories"
            onMouseLeave={() => setHovered(null)}
          >
            <defs>
              <radialGradient id="halo-warm" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(201,163,114,0.18)" />
                <stop offset="55%" stopColor="rgba(201,163,114,0.06)" />
                <stop offset="100%" stopColor="rgba(201,163,114,0)" />
              </radialGradient>
              <radialGradient id="halo-active" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(232,192,138,0.32)" />
                <stop offset="55%" stopColor="rgba(232,192,138,0.10)" />
                <stop offset="100%" stopColor="rgba(232,192,138,0)" />
              </radialGradient>
              <radialGradient id="word-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(244,236,220,0.32)" />
                <stop offset="100%" stopColor="rgba(244,236,220,0)" />
              </radialGradient>
            </defs>

            {/* Cluster halos — territories on the atlas */}
            {Object.entries(CLUSTERS).map(([key, c]) => (
              <ellipse
                key={`halo-${key}`}
                cx={c.cx}
                cy={c.cy}
                rx={c.rx}
                ry={c.ry}
                fill={
                  activeCluster === key
                    ? "url(#halo-active)"
                    : "url(#halo-warm)"
                }
                style={{
                  opacity: mounted ? (active && activeCluster !== key ? 0.5 : 1) : 0,
                  transition:
                    "opacity 1.2s ease-out 0.1s, fill 350ms ease",
                  pointerEvents: "none",
                }}
              />
            ))}

            {/* Cluster labels — region toponyms in serif italic */}
            {Object.entries(CLUSTERS).map(([key, c]) => (
              <text
                key={`label-${key}`}
                x={c.cx}
                y={c.cy + 5}
                textAnchor="middle"
                fontSize="15.5"
                fontFamily="'Cormorant Garamond', 'Cormorant', Georgia, serif"
                fontStyle="italic"
                letterSpacing="0.6"
                fill={
                  activeCluster === key
                    ? "rgba(232,192,138,0.92)"
                    : active
                      ? "rgba(232,192,138,0.20)"
                      : "rgba(232,192,138,0.50)"
                }
                style={{
                  opacity: mounted ? 1 : 0,
                  transition: "opacity 0.9s ease-out 0.35s, fill 350ms ease",
                  pointerEvents: "none",
                }}
              >
                {c.label}
              </text>
            ))}

            {/* Surveyor's lines from active word to its 5 nearest */}
            {active &&
              neighbors.map((n, i) => (
                <path
                  key={`line-${n.text}`}
                  d={curvedPath(active.x, active.y, n.x, n.y)}
                  fill="none"
                  stroke="rgba(232,192,138,0.55)"
                  strokeWidth="0.7"
                  strokeDasharray="2 2.5"
                  style={{
                    opacity: 0.92,
                    transition: `opacity 220ms ease-out ${i * 35}ms`,
                  }}
                />
              ))}

            {/* Words */}
            {words.map((w) => {
              const isActive = active?.text === w.text;
              const isNeighbor = neighborSet.has(w.text);
              const dimmed = !!active && !isActive && !isNeighbor;
              return (
                <g
                  key={w.text}
                  style={{
                    opacity: mounted ? (dimmed ? 0.12 : 1) : 0,
                    transition: `opacity 600ms ease-out ${
                      mounted ? w.spawnDelay : 0
                    }ms`,
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => !locked && setHovered(w)}
                  onClick={() =>
                    setLocked(locked?.text === w.text ? null : w)
                  }
                >
                  {/* Hit target — invisible, expanded for easier hover */}
                  <rect
                    x={w.x - 30}
                    y={w.y - 10}
                    width={Math.max(64, w.text.length * 7 + 14)}
                    height="20"
                    fill="transparent"
                  />
                  {isActive && (
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r="11"
                      fill="url(#word-glow)"
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                  <circle
                    cx={w.x}
                    cy={w.y}
                    r={isActive ? 2.8 : isNeighbor ? 2.3 : 1.7}
                    fill={
                      isActive
                        ? "rgba(244,236,220,1)"
                        : isNeighbor
                          ? "rgba(232,192,138,1)"
                          : "rgba(201,163,114,0.72)"
                    }
                    style={{ transition: "r 200ms, fill 200ms" }}
                  />
                  <text
                    x={w.x + 6}
                    y={w.y + 3.6}
                    fontSize={isActive ? 13 : 11.5}
                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                    fontWeight={isActive ? 600 : 400}
                    fill={
                      isActive
                        ? "rgba(244,236,220,1)"
                        : isNeighbor
                          ? "rgba(244,236,220,0.97)"
                          : "rgba(244,236,220,0.84)"
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
          <div className="mt-3 px-3 flex items-center justify-between gap-4 border-t border-hairline/40 pt-3 min-h-[36px]">
            {active ? (
              <p className="font-mono text-[12px] text-mute leading-relaxed">
                <span className="text-sepia/95">{active.text}</span>
                <span className="mx-2 text-mute/50">·</span>
                <span className="font-serif italic text-ink/85">
                  {active.clusterLabel}
                </span>
                <span className="mx-2 text-mute/50">·</span>
                <span className="text-mute/80">nearest:</span>{" "}
                <span className="text-ink/85">
                  {neighbors.map((n) => n.text).join(", ")}
                </span>
              </p>
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
                hover any word — click to lock
              </p>
            )}
            {locked ? (
              <button
                onClick={() => setLocked(null)}
                className="font-mono text-[10px] uppercase tracking-[0.24em] text-sepia/85 hover:text-sepia transition-colors whitespace-nowrap"
              >
                ↺ release
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        A hand-laid sketch &mdash; a real embedding map would arrange these
        automatically. Geometry, not magic.
      </p>
    </article>
  );
}
