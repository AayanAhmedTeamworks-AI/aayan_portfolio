"use client";

/**
 * Offline-sync state machine for Bautagesbericht. The lifecycle of a report
 * from local edit → queued in IndexedDB → background-synced → resolved /
 * conflicted. SVG, all in one viewBox, sepia hairlines on a marble background.
 *
 * A single pulse travels the happy path (DRAFT → SYNCED) on a slow loop, so
 * the diagram quietly demonstrates itself as you read.
 */
export function OfflineSyncDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 200"
      className={className}
      role="img"
      aria-label="Bautagesbericht offline-sync state machine"
    >
      <defs>
        <marker
          id="osd-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(201,163,114,0.7)" />
        </marker>
      </defs>

      {/* Edges */}
      <g
        stroke="rgba(201,163,114,0.55)"
        strokeWidth="1"
        fill="none"
        strokeDasharray="2 3"
      >
        <line x1="60" y1="40" x2="60" y2="62" markerEnd="url(#osd-arrow)" />
        <line x1="60" y1="100" x2="60" y2="122" markerEnd="url(#osd-arrow)" />
        <line x1="60" y1="158" x2="60" y2="180" />
        <line x1="120" y1="80" x2="178" y2="80" markerEnd="url(#osd-arrow)" />
        <line x1="240" y1="80" x2="298" y2="80" markerEnd="url(#osd-arrow)" />
        <line x1="240" y1="100" x2="240" y2="158" markerEnd="url(#osd-arrow)" />
        <line x1="180" y1="158" x2="120" y2="100" />
      </g>

      {/* States */}
      <g fontFamily="ui-monospace, SFMono-Regular, monospace" fontSize="9">
        <State x={20} y={20} label="DRAFT" sub="local edits" />
        <State x={20} y={62} label="QUEUED" sub="IndexedDB" />
        <State x={20} y={122} label="SYNCING" sub="background" />
        <State x={180} y={62} label="CONFLICT?" sub="server-side check" />
        <State x={300} y={62} label="SYNCED" sub="server confirmed" emphasis />
        <State x={180} y={122} label="RESOLVE" sub="merge / retry" />
      </g>

      {/* Pulse — happy-path traveling dot. Animates DRAFT→QUEUED→SYNCING→CONFLICT→SYNCED */}
      <circle r="2" fill="rgba(232,192,138,0.95)">
        <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
          <mpath href="#osd-pulse-path" />
        </animateMotion>
      </circle>
      <path
        id="osd-pulse-path"
        d="M 60 40 L 60 62 L 60 80 L 60 100 L 60 122 L 120 100 L 180 80 L 240 80 L 300 80"
        fill="none"
        stroke="none"
      />
    </svg>
  );
}

function State({
  x,
  y,
  label,
  sub,
  emphasis = false,
}: {
  x: number;
  y: number;
  label: string;
  sub: string;
  emphasis?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={80}
        height={20}
        rx={3}
        fill={emphasis ? "rgba(201,163,114,0.18)" : "rgba(244,236,220,0.04)"}
        stroke={
          emphasis ? "rgba(232,192,138,0.85)" : "rgba(244,236,220,0.32)"
        }
        strokeWidth="0.7"
      />
      <text
        x={x + 40}
        y={y + 12}
        textAnchor="middle"
        fill={emphasis ? "rgba(232,192,138,0.95)" : "rgba(244,236,220,0.85)"}
        letterSpacing="0.12em"
      >
        {label}
      </text>
      <text
        x={x + 40}
        y={y + 30}
        textAnchor="middle"
        fill="rgba(125,112,96,0.85)"
        fontSize="6.5"
        letterSpacing="0.06em"
      >
        {sub}
      </text>
    </g>
  );
}
