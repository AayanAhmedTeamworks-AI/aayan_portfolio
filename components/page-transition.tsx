"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Crossfade fallback for browsers without View Transitions API support
 * (Firefox as of writing). On VT-capable browsers, renders children plainly
 * so the native transition isn't doubled up. Respects `?no-vt=1` to force
 * the fallback path for manual testing.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Default to VT-enabled to avoid a flash of crossfade on the first
  // client paint before feature detection runs.
  const [supportsVT, setSupportsVT] = useState<boolean>(true);

  useEffect(() => {
    const hasVT =
      typeof document !== "undefined" && "startViewTransition" in document;
    const forceFallback =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("no-vt");
    setSupportsVT(hasVT && !forceFallback);
  }, []);

  if (supportsVT) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
