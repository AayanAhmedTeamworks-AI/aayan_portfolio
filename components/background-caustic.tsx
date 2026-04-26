/**
 * Background caustic — a slow drifting marble-light shader-look for
 * placement behind colophons, endplates, and similar quiet zones.
 *
 * Implementation: pure CSS. Two pseudo-elements layered with multiple
 * radial gradients in sepia tones, blurred and rotated at different
 * rates, give the visual rhythm of caustic light pooling on stone
 * without spinning up a WebGL canvas. Composited on the GPU; zero JS.
 *
 * Mounted as an absolutely-positioned div inside a `relative` parent.
 */
export function BackgroundCaustic({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
    >
      <div className="caustic-layer caustic-layer-a" />
      <div className="caustic-layer caustic-layer-b" />
    </div>
  );
}
