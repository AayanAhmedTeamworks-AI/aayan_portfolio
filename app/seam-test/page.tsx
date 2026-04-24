import { FrontispieceBust } from "@/components/frontispiece-bust";
import { ChapterHeading } from "@/components/chapter-heading";
import { Meander } from "@/components/meander";

export const metadata = {
  title: "Seam test — Codex Ahmed",
  description:
    "Eyeball the palette transition between the hero and a chapter surface. Non-production route.",
  robots: { index: false, follow: false },
};

/**
 * Palette / seam diagnostic page. Renders the real hero block immediately
 * adjacent to a real chapter surface so the transition can be inspected at
 * the hairline border. If there is a visible brightness step, the canvas
 * token is still too light. Target: one room, not two rooms pasted together.
 *
 * Route: /seam-test. Removed (or kept behind a flag) once the palette lands.
 */
export default function SeamTestPage() {
  return (
    <div>
      <section
        className="relative flex min-h-[72vh] flex-col overflow-hidden border-b border-hairline"
        data-cursor="Look"
      >
        <FrontispieceBust />
        <div className="ambient-glow" />
        <div className="relative z-20 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-center px-8 pt-24 pb-10 md:px-16">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-mute">
            Seam test · hero block
          </p>
          <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.03em] md:text-6xl">
            Hero canvas — vignette, noise, HDRI
          </h1>
          <p className="mt-5 max-w-[50ch] text-[14px] leading-[1.7] text-ink/70">
            Real scene. Real post stack. The bottom edge of this block sits
            flush against the chapter block below.
          </p>
          <Meander className="mt-10 h-3 w-32 text-sepia/55" />
        </div>
      </section>

      <section className="relative mx-auto max-w-[90rem] px-8 pt-24 pb-24 md:px-16">
        <ChapterHeading
          numeral="—"
          chapter="Test"
          label="Chapter surface"
          tagline="Plain canvas. No vignette, no post stack. This is what every non-hero page renders."
        />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
          <p className="max-w-[62ch] text-[15px] leading-[1.75] text-ink/80">
            Scroll up and down across the border. If there is a visible
            brightness step, the canvas token is still too light. The palette
            target is that this paragraph and the hero paragraph above read as
            the same room, not two rooms pasted together.
          </p>
          <p className="max-w-[62ch] text-[15px] leading-[1.75] text-ink/80">
            Check the mute colour, hairline dividers, and the marble surface
            used on case-study cards. Each token kept its relative step below
            the canvas: hairline must stay visible without shouting, marble
            must sit one notch above canvas on a bento card.
          </p>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-6 border-t border-hairline pt-8">
          <Swatch name="canvas" value="var(--color-canvas)" />
          <Swatch name="marble" value="var(--color-marble)" />
          <Swatch name="hairline" value="var(--color-hairline)" />
          <Swatch name="mute" value="var(--color-mute)" />
          <Swatch name="sepia" value="var(--color-sepia)" />
          <Swatch name="ink" value="var(--color-ink)" />
        </div>
      </section>
    </div>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="inline-block size-8 rounded ring-1 ring-hairline"
        style={{ background: value }}
      />
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mute">
        {name}
      </span>
    </div>
  );
}
