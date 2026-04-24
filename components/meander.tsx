type Props = { className?: string };

/**
 * Classic Greek key (meander) as a repeating SVG pattern.
 * The unit cell (14 × 12) interlocks horizontally so the
 * stripe reads as a continuous spiral across any width.
 */
export function Meander({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 280 12"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="meander-pattern"
          x="0"
          y="0"
          width="14"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 1 L0 11 L4 11 L4 3 L8 3 L8 9 L6 9 L6 5 L10 5 L10 11 L14 11 L14 1"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="280" height="12" fill="url(#meander-pattern)" />
    </svg>
  );
}
