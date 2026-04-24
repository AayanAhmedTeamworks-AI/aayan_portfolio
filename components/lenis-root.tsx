"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { scrollProgressRef } from "@/lib/scroll-progress";

function ScrollTracker() {
  useLenis((lenis) => {
    scrollProgressRef.current = lenis.progress || 0;
  });
  return null;
}

export function LenisRoot({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1 }}>
      <ScrollTracker />
      {children}
    </ReactLenis>
  );
}
