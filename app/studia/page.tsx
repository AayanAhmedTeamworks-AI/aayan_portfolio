import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { PageTurn } from "@/components/page-turn";
import { CardStack3D } from "@/components/card-stack-3d";

const pieces = [
  {
    title: "GEO Tune-Up",
    kind: "Personal research · active",
    year: "2026 —",
    blurb:
      "A TypeScript / Cloudflare-Workers tool that reverse-engineers how LLMs rank and cite websites. Given a URL, it runs a battery of prompts across multiple models and reports whether the URL is cited, paraphrased, or ignored — with concrete rewrite suggestions.",
  },
  {
    title: "Explainable AI — LIME & saliency on MNIST",
    kind: "Academic · THI Ingolstadt",
    year: "2024",
    blurb:
      "Coursework exploring two approaches to model interpretability: local surrogate explanations via LIME, and pixel-attribution saliency maps on a trained MNIST classifier. The interesting part was not the result but the disagreement between the two — a small lesson in picking a method to fit a question.",
  },
  {
    title: "Evaluations & notes",
    kind: "Internal reading notes",
    year: "2025 — 2026",
    blurb:
      "Short written evaluations produced before major architectural decisions at work: n8n vs. Make.com for orchestration; Supabase vs. Firebase for full-stack; Groq vs. OpenAI under a given latency budget. Archived internally; occasional excerpts published here.",
  },
];

const ROMAN = ["i", "ii", "iii"];

export default function Studia() {
  const cards = pieces.map((p, i) => (
    <article
      key={p.title}
      className="h-full w-full rounded-2xl bg-marble/40 ring-1 ring-hairline p-2"
    >
      <div
        className="h-full rounded-[calc(1rem-6px)] bg-canvas/80 p-8 md:p-10 flex flex-col"
        style={{
          boxShadow:
            "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
          {p.kind}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
          {p.year}
        </p>
        <h2 className="font-serif text-[1.85rem] md:text-[2.25rem] tracking-[-0.02em] leading-[1.05] text-ink mt-10">
          {p.title}
        </h2>
        <p className="mt-6 text-[14px] leading-[1.7] text-ink/75 flex-1">
          {p.blurb}
        </p>
        <div className="mt-auto pt-8 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
            Studia
          </span>
          <span className="h-px bg-hairline flex-1" />
          <span className="font-serif italic text-sepia/70 text-sm">
            {ROMAN[i]}
          </span>
        </div>
      </div>
    </article>
  ));

  return (
    <>
      <ChapterProgress />
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
        <ChapterCover
          numeral="II"
          chapter="Studia"
          label="Research & study"
          tagline="Questions pulled at, sometimes answered. Some self-initiated, some coursework at THI Ingolstadt. Use ← → to leaf through."
        />

        <CardStack3D cards={cards} className="mt-24" />

        <Colophon numeral="II" />
      </div>
      <PageTurn
        numeral="II"
        chapter="Studia"
        nextNumeral="III"
        nextChapter="Civitas"
        nextHref="/civitas"
      />
    </>
  );
}
