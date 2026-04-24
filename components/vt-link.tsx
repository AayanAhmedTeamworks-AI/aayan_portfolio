"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Props = ComponentProps<typeof Link> & { children: ReactNode };

/**
 * Thin wrapper over `next/link`. Formerly intercepted clicks and wrapped
 * `router.push` in `document.startViewTransition` — removed because the
 * View Transitions API's callback timing model clashes with Next App
 * Router's async/Suspense-streamed rendering, producing a cascade of
 * `AbortError`, `InvalidStateError`, and `TimeoutError` DOMExceptions
 * with no visible morph on the numerals. `PageTransition` handles the
 * crossfade now, and the `chapter-numeral-*` CSS classes remain in
 * place as inert markers — ready to re-light if a future setup makes
 * the morph reliable (React 19 `ViewTransition`, a Next API that
 * synchronises the router commit, etc.).
 *
 * Kept as a typed wrapper (not deleted) so existing call-sites don't
 * need to be migrated back to raw `next/link`.
 */
export function VTLink({ children, ...props }: Props) {
  return <Link {...props}>{children}</Link>;
}
