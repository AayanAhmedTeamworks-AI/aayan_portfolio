"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

/**
 * Crossfade between chapter routes on pathname change. Used everywhere —
 * previously gated behind a View Transitions feature-detect, but the
 * browser API proved unreliable in combination with Next App Router's
 * async rendering, so the JS morph path was ripped out and this crossfade
 * is now the sole transition mechanism.
 *
 * `mode="wait"` keeps the outgoing page mounted until the fade-out
 * finishes, then mounts the incoming one. `initial={false}` suppresses
 * the fade-in on the very first page load (covered by MeanderLoader).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
