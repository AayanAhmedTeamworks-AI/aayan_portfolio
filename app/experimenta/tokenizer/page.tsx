import Link from "next/link";
import { TokenizerComparator } from "@/components/tokenizer-comparator";

export const metadata = {
  title: "Tokenizer comparator — Codex Ahmed",
  description:
    "Same text, three tokenizers, three different breaks. Client-side, zero API. The first place a model can fail to understand you — and the place where prompts get expensive without you noticing.",
};

export default function TokenizerPage() {
  return (
    <main className="max-w-5xl mx-auto px-8 md:px-12 pt-32 pb-24">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        <Link
          href="/#lab"
          className="hover:text-sepia transition-colors duration-300"
        >
          ← Back to the codex
        </Link>
      </p>
      <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] tracking-[-0.03em] text-ink">
        Tokenizer <span className="italic text-sepia/95">comparator</span>.
      </h1>
      <p className="mt-6 max-w-[60ch] font-serif italic text-mute text-lg leading-relaxed">
        Same text, three tokenizers, three different breaks. The first place
        a model can fail to understand you — and the place where prompts get
        expensive without you noticing. Runs entirely in your browser.
      </p>

      <div className="mt-12">
        <TokenizerComparator />
      </div>
    </main>
  );
}
