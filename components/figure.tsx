import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption: string;
  label: string;
  width: number;
  height: number;
};

/**
 * Figure primitive used inside MDX case studies. Plate-framed image with a
 * two-column figcaption: caption on the left, figure label on the right,
 * both in the same small-caps mono register as the PortraitNiche.
 */
export function Figure({ src, alt, caption, label, width, height }: Props) {
  return (
    <figure className="my-14">
      <div className="relative overflow-hidden rounded-lg bg-marble/40 ring-1 ring-hairline">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto w-full"
          sizes="(max-width: 768px) 100vw, 768px"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        <span>{caption}</span>
        <span className="text-sepia/80">{label}</span>
      </figcaption>
    </figure>
  );
}
