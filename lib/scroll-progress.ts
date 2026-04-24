/**
 * Shared mutable ref holding the current Lenis scroll progress (0 → 1).
 * Updated by the Lenis scroll callback; read imperatively inside useFrame
 * loops so that scroll-driven animation never triggers a React re-render.
 */
export const scrollProgressRef = { current: 0 };
