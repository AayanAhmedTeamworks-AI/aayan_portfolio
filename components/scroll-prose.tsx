"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  type ReactNode,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Scroll-linked prose. Each word's opacity is tied to a slice of the
 * paragraph's scroll progress, so words *brighten one at a time* as the
 * reader passes through. The text starts dim and lights up as it moves
 * through the reading zone — the page reads itself, in motion, with the
 * canvas as the fixed backdrop the words travel across.
 *
 * Accepts JSX children (including links and emphasis spans) — the children
 * are walked recursively, text nodes split into word tokens, and each non-
 * whitespace token wrapped in a <Word/> with its own derived opacity. JSX
 * structure (anchors, em, etc.) is preserved.
 */
export function ScrollProse({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "end 0.4"],
  });

  const totalWords = countWords(children);
  const state = { idx: 0, total: Math.max(1, totalWords), progress: scrollYProgress };
  const rendered = processNode(children, state, "p");

  return (
    <p ref={ref} className={className}>
      {rendered}
    </p>
  );
}

function countWords(node: ReactNode): number {
  let count = 0;
  Children.forEach(node, (child) => {
    if (typeof child === "string") {
      count += child.split(/\s+/).filter((t) => t.length > 0).length;
    } else if (typeof child === "number") {
      count += 1;
    } else if (isValidElement(child)) {
      const props = child.props as { children?: ReactNode };
      count += countWords(props.children);
    }
  });
  return count;
}

function processNode(
  node: ReactNode,
  state: { idx: number; total: number; progress: MotionValue<number> },
  keyPrefix: string,
): ReactNode {
  return Children.map(node, (child, ci) => {
    if (typeof child === "string") {
      const tokens = child.split(/(\s+)/);
      return tokens.map((token, ti) => {
        if (!token.trim()) return token;
        const idx = state.idx++;
        const start = idx / state.total;
        const end = (idx + 1) / state.total;
        return (
          <Word
            key={`${keyPrefix}-${ci}-w${ti}-${idx}`}
            progress={state.progress}
            start={start}
            end={end}
          >
            {token}
          </Word>
        );
      });
    }
    if (typeof child === "number") {
      const idx = state.idx++;
      const start = idx / state.total;
      const end = (idx + 1) / state.total;
      return (
        <Word
          key={`${keyPrefix}-${ci}-n-${idx}`}
          progress={state.progress}
          start={start}
          end={end}
        >
          {String(child)}
        </Word>
      );
    }
    if (isValidElement(child)) {
      const props = child.props as { children?: ReactNode };
      const newChildren = processNode(
        props.children,
        state,
        `${keyPrefix}-${ci}c`,
      );
      return cloneElement(
        child,
        { key: `${keyPrefix}-${ci}e` } as object,
        newChildren,
      );
    }
    return child;
  });
}

function Word({
  progress,
  start,
  end,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  children: ReactNode;
}) {
  const opacity = useTransform(
    progress,
    [Math.max(0, start - 0.04), Math.min(1, end + 0.01)],
    [0.18, 1],
  );
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}
    </motion.span>
  );
}
