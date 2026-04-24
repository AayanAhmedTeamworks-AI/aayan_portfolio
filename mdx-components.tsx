import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="font-serif text-5xl md:text-6xl tracking-[-0.025em] text-ink mt-16 mb-6"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="font-serif text-3xl md:text-4xl tracking-[-0.02em] text-ink mt-14 mb-5"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="font-serif text-2xl md:text-3xl tracking-[-0.015em] text-ink mt-10 mb-4"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="text-[15px] leading-[1.75] text-ink/85 mb-5 max-w-[62ch]"
        {...props}
      />
    ),
    a: (props) => (
      <a
        className="underline decoration-sepia/50 underline-offset-4 hover:decoration-sepia transition-colors"
        {...props}
      />
    ),
    code: (props) => (
      <code
        className="font-mono text-[13px] px-1.5 py-0.5 bg-marble rounded text-ink"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="font-mono text-[13px] bg-marble/60 p-5 rounded-lg overflow-x-auto my-6 border border-hairline"
        {...props}
      />
    ),
    ul: (props) => (
      <ul
        className="list-disc marker:text-sepia/70 pl-5 space-y-2 text-[15px] text-ink/85 mb-5 max-w-[62ch]"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="list-decimal marker:text-sepia/70 pl-5 space-y-2 text-[15px] text-ink/85 mb-5 max-w-[62ch]"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="border-l-2 border-sepia pl-6 my-10 font-serif italic text-2xl md:text-3xl tracking-tight text-ink/90 max-w-[50ch]"
        {...props}
      />
    ),
    hr: () => <hr className="my-14 border-t border-hairline" />,
    ...components,
  };
}
