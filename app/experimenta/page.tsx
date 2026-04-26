import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { ReadingFocus } from "@/components/reading-focus";
import { Reveal } from "@/components/reveal";

type ApparatusStatus =
  | "in praeparatione"
  | "drafted"
  | "in revisione"
  | "shipped";

type Apparatus = {
  numeral: string;
  title: string;
  description: string;
  status: ApparatusStatus;
};

const apparatus: Apparatus[] = [
  {
    numeral: "i",
    title: "Tokenizer comparison",
    description:
      "Paste a passage, see how each major model fragments it. Token counts and visualised splits across GPT-4o, Claude, Gemma, Llama, and Mistral, side by side. Reveals where prompts get expensive and where languages other than English pay the tax.",
    status: "in praeparatione",
  },
  {
    numeral: "ii",
    title: "Ask the codex",
    description:
      "Retrieval-augmented Q&A grounded in this site's own writing — case studies, the internship report, any essays. Returns a paragraph with cited sources and visible latency. The portfolio you can talk to.",
    status: "in praeparatione",
  },
  {
    numeral: "iii",
    title: "Embedding atlas",
    description:
      "A 2D scatter of the codex's vocabulary projected from a 384-dimension embedding space. Hover a point to see the source sentence, click to highlight neighbours. Shows what the model thinks lives next to what.",
    status: "drafted",
  },
  {
    numeral: "iv",
    title: "GEO Tune-Up",
    description:
      "The Generative-Engine-Optimization tool from Studia, hosted live. Paste a URL, watch the LLM-citation analysis run, get rewrite suggestions ranked by expected lift in retrievability.",
    status: "in praeparatione",
  },
];

export default function Experimenta() {
  return (
    <>
      <ChapterProgress />
      <ReadingFocus selector="[data-reading-focus] p" />
      <div
        data-reading-focus
        className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16"
      >
        <ChapterCover
          numeral="VI"
          chapter="Experimenta"
          label="Apparatus"
          tagline="Live demonstrations and working drafts. Each ships once it works on a phone in a marginal LTE signal — the only test that matters."
        />

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          {apparatus.map((a, i) => (
            <Reveal key={a.numeral} delay={i * 100}>
              <article className="h-full rounded-2xl bg-marble/30 ring-1 ring-hairline p-2">
                <div
                  className="h-full rounded-[calc(1rem-6px)] bg-canvas/70 p-8 md:p-10 flex flex-col min-h-[18rem]"
                  style={{
                    boxShadow:
                      "inset 0 0 40px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                      Apparatus
                    </span>
                    <span className="font-serif italic text-sepia/70 text-sm">
                      {a.numeral}
                    </span>
                  </div>
                  <h3 className="font-serif text-[1.85rem] md:text-[2.25rem] tracking-[-0.02em] leading-[1.05] text-ink">
                    {a.title}
                  </h3>
                  <p className="mt-5 text-[14.5px] leading-[1.7] text-ink/75 flex-1">
                    {a.description}
                  </p>
                  <div className="mt-auto pt-8 flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-sepia/85 italic">
                      {a.status}
                    </span>
                    <span className="h-px bg-hairline flex-1" />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-20 max-w-[60ch] mx-auto text-center font-serif italic text-mute text-lg leading-relaxed">
          The plates above are placeholders for live tools in active
          development. Each gets its own page on this chapter once it can
          run unattended.
        </p>

        <Colophon numeral="VI" />
      </div>
    </>
  );
}
