"use client";

/**
 * A linear flow visual — labelled steps connected by arrows, with a sepia
 * pulse traveling left-to-right on a slow loop. Used for n8n-style pipelines
 * where the work is essentially sequential transformation.
 */
export function FlowSteps({
  steps,
  className,
}: {
  steps: string[];
  className?: string;
}) {
  const n = steps.length;
  const width = 360;
  const stepW = width / n;
  const cy = 32;

  return (
    <svg
      viewBox={`0 0 ${width} 64`}
      className={className}
      role="img"
      aria-label="Pipeline flow"
    >
      <defs>
        <marker
          id="fs-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="rgba(201,163,114,0.6)" />
        </marker>
      </defs>

      {/* Connectors */}
      {steps.slice(0, -1).map((_, i) => {
        const x1 = (i + 0.5) * stepW + 24;
        const x2 = (i + 1.5) * stepW - 24;
        return (
          <line
            key={i}
            x1={x1}
            y1={cy}
            x2={x2}
            y2={cy}
            stroke="rgba(201,163,114,0.45)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            markerEnd="url(#fs-arrow)"
          />
        );
      })}

      {/* Step labels */}
      {steps.map((s, i) => {
        const cx = (i + 0.5) * stepW;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill="rgba(244,236,220,0.06)"
              stroke="rgba(232,192,138,0.7)"
              strokeWidth="0.6"
            />
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize="8"
              letterSpacing="0.12em"
              fill="rgba(244,236,220,0.85)"
            >
              {s}
            </text>
          </g>
        );
      })}

      {/* Travelling pulse along the centre line */}
      <circle r="2.2" fill="rgba(232,192,138,0.95)">
        <animateMotion
          dur={`${Math.max(4, n * 1.4)}s`}
          repeatCount="indefinite"
        >
          <mpath href="#fs-pulse-path" />
        </animateMotion>
      </circle>
      <path
        id="fs-pulse-path"
        d={`M ${stepW * 0.5} ${cy} L ${stepW * (n - 0.5)} ${cy}`}
        fill="none"
        stroke="none"
      />
    </svg>
  );
}
