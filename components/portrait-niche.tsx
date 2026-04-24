import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption: React.ReactNode;
  figureLabel: string;
  width: number;
  height: number;
  priority?: boolean;
  /** Dark niche for images that ship on a black background (the sculpted
   *  bust PNG). Adds a warm halo and a radial mask so the edges fade into
   *  the canvas instead of reading as a hard rectangle. */
  variant?: "plate" | "niche";
};

/**
 * Caption-first figure primitive. Two variants:
 *  - `plate`: bright, light-ringed, for photographs (e.g. València).
 *  - `niche`: dark, warm-haloed, radial-masked, for sculpted portraits.
 * Figcaption keeps the same two-column structure: caption on the left,
 * figure label on the right, both small-caps / mono.
 */
export function PortraitNiche({
  src,
  alt,
  caption,
  figureLabel,
  width,
  height,
  priority = false,
  variant = "plate",
}: Props) {
  return (
    <figure className="relative">
      {variant === "niche" ? (
        <div className="relative overflow-hidden rounded-lg bg-ink/[0.97] ring-1 ring-hairline/40">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 52% 46% at 52% 48%, rgba(180,142,90,0.32) 0%, rgba(139,107,63,0.08) 48%, transparent 74%)",
            }}
          />
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            quality={95}
            className="relative z-10 h-auto w-full select-none"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 56% 68% at 50% 50%, #000 60%, transparent 95%)",
              maskImage:
                "radial-gradient(ellipse 56% 68% at 50% 50%, #000 60%, transparent 95%)",
              filter: "contrast(1.02) brightness(0.99) saturate(0.95)",
            }}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-lg bg-marble/40 ring-1 ring-hairline">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            className="h-auto w-full grayscale-[8%] contrast-[1.02] brightness-[0.98]"
          />
        </div>
      )}
      <figcaption className="mt-4 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        <span>{caption}</span>
        <span className="text-sepia/80">{figureLabel}</span>
      </figcaption>
    </figure>
  );
}
