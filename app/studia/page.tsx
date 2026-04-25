import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterTitleSticky } from "@/components/chapter-title-sticky";
import Colophon from "@/components/colophon";
import { PageTurn } from "@/components/page-turn";
import { ReadingFocus } from "@/components/reading-focus";
import { Reveal } from "@/components/reveal";

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

export default function Studia() {
  return (
    <>
      <ChapterProgress />
      <ReadingFocus selector="[data-reading-focus] p" />
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
        <ChapterTitleSticky
          numeral="II"
          chapter="Studia"
          label="Research & study"
          tagline="Questions pulled at, sometimes answered. Some self-initiated, some coursework at THI Ingolstadt."
        />

        <ul
          data-reading-focus
          className="mt-20 divide-y divide-hairline border-t border-hairline"
        >
          {pieces.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 100}>
                <article className="py-12 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                      {p.kind}
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
                      {p.year}
                    </p>
                  </div>
                  <div className="md:col-span-9">
                    <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.025em] leading-[1] text-ink">
                      {p.title}
                    </h2>
                    <p className="mt-6 text-[15px] leading-[1.75] text-ink/75 max-w-[62ch]">
                      {p.blurb}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

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
