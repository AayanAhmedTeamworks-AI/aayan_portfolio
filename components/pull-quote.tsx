type Props = { children: React.ReactNode; attribution?: string };

export function PullQuote({ children, attribution }: Props) {
  return (
    <figure className="my-16 max-w-4xl mx-auto text-center">
      <blockquote className="font-serif italic text-3xl md:text-5xl tracking-[-0.02em] leading-[1.1] text-ink/90">
        <span className="text-sepia/70 mr-2">“</span>
        {children}
        <span className="text-sepia/70 ml-1">”</span>
      </blockquote>
      {attribution ? (
        <figcaption className="mt-6 font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
          — {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
