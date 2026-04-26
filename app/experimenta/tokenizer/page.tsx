import { ChapterProgress } from "@/components/chapter-progress";
import { ChapterCover } from "@/components/chapter-cover";
import Colophon from "@/components/colophon";
import { TokenizerComparator } from "@/components/tokenizer-comparator";

export const metadata = {
  title: "Tokenizer comparator — Codex Ahmed",
  description:
    "Same text, three tokenizers, three different breaks. Client-side, zero API. The first place a model can fail to understand you — and the place where prompts get expensive without you noticing.",
};

export default function TokenizerPage() {
  return (
    <>
      <ChapterProgress />
      <div className="max-w-[90rem] mx-auto px-8 md:px-16 pt-32 pb-16">
        <ChapterCover
          numeral="VI · i"
          chapter="Experimenta"
          label="Tokenizer comparator"
          tagline="Same text, three tokenizers, three different breaks. The first place a model can fail to understand you — and the place where prompts get expensive without you noticing. Runs entirely in your browser."
        />

        <div className="mt-12 max-w-5xl mx-auto">
          <TokenizerComparator />
        </div>

        <Colophon numeral="VI · i" />
      </div>
    </>
  );
}
