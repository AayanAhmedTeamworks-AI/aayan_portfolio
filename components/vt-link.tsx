"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";

type Props = ComponentProps<typeof Link> & { children: ReactNode };

/**
 * Drop-in Link replacement. When the browser supports the View Transitions
 * API, interception wraps `router.push` inside `document.startViewTransition`
 * so matching `view-transition-name` elements morph between positions.
 * On browsers without it (Firefox, at time of writing), passes through
 * to next/link — the PageTransition component handles crossfade there.
 *
 * Manual fallback trigger: append `?no-vt=1` to any URL to force the framer
 * crossfade path even on View-Transition-capable browsers.
 */
export function VTLink({ onClick, children, ...props }: Props) {
  const router = useRouter();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    )
      return;

    const href =
      typeof props.href === "string" ? props.href : props.href?.toString();
    if (
      !href ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("#")
    )
      return;

    const hasVT =
      typeof document !== "undefined" && "startViewTransition" in document;
    const forceFallback =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("no-vt");
    if (!hasVT || forceFallback) return;

    e.preventDefault();
    (
      document as unknown as {
        startViewTransition: (cb: () => Promise<void> | void) => void;
      }
    ).startViewTransition(async () => {
      router.push(href);
      // Two frames give Next.js time to render the destination before the
      // browser snapshots the "new" state.
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));
    });
  };

  return (
    <Link {...props} onClick={handle}>
      {children}
    </Link>
  );
}
