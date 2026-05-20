"use client";

/**
 * LenisRoot — formerly wrapped children in <ReactLenis root> for smooth
 * scroll. Removed because Lenis interferes with framer-motion's
 * `useScroll` in production builds (Turbopack + React 19 + static
 * prerender): scrollYProgress gets measured before Lenis initialises and
 * sticks near the section start, breaking the MuseumTransition iris and
 * WorkBillboard card crossfade. Native browser scroll is smooth enough
 * and plays cleanly with framer-motion. Kept as a pass-through so the
 * rest of the layout doesn't need to change.
 */
export function LenisRoot({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
