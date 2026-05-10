import { TokenizerComparator } from "@/components/tokenizer-comparator";
import { DataOwnershipDemo } from "@/components/data-ownership-demo";
import { SchemaExtractionDemo } from "@/components/schema-extraction-demo";
import { EmbeddingMapDemo } from "@/components/embedding-map-demo";

/**
 * The Lab — a distinct visual register at the foot of the page, before the
 * footer. Slightly lighter marble background, hairline-framed, its own
 * heading. Tokenizer comparator is artifact i; new demos drop in beneath as
 * <article> blocks and the room grows downward.
 */
export function LabSection() {
  return (
    <section
      id="lab"
      className="relative w-full bg-marble/35 ring-1 ring-inset ring-hairline/60 py-24 md:py-32"
      data-cursor="Play"
    >
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <article>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-sepia/85">
              Artifact i
            </span>
            <span className="h-px bg-hairline flex-1" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
              Tokenizer comparator
            </span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl tracking-[-0.02em] text-ink mb-2">
            How three models read the same paragraph.
          </h3>
          <p className="max-w-[60ch] font-serif italic text-mute text-base">
            Type or paste anything. GPT-4o, GPT-4 / 3.5, and Llama 3 will
            each fragment it into tokens and price you for the privilege.
            Watch where non-English text pays the tax.
          </p>
          <TokenizerComparator />
        </article>

        <DataOwnershipDemo />

        <SchemaExtractionDemo />

        <EmbeddingMapDemo />
      </div>
    </section>
  );
}
