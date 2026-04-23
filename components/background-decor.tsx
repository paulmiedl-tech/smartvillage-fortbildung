/**
 * Ambient page background: soft warm gradients + faint dot-network pattern.
 *
 * Everything sits behind content with pointer-events disabled and low opacity,
 * so readability of foreground elements is never compromised.
 */
export function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[color:var(--color-background)]" />

      {/* Fixed light-lavender hex: the --color-lavender token is dark in dark
          mode (for interactive surfaces), but the ambient blob should stay a
          soft light glow regardless of theme. */}
      <div
        className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl dark:opacity-25"
        style={{ backgroundColor: "#d1deff" }}
      />
      <div
        className="absolute -bottom-48 -right-40 h-[620px] w-[620px] rounded-full opacity-[0.08] blur-3xl dark:opacity-[0.18]"
        style={{ backgroundColor: "var(--color-accent)" }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-30 blur-3xl dark:opacity-10"
        style={{ backgroundColor: "var(--color-cream)" }}
      />

      <svg
        className="absolute inset-0 h-full w-full text-[color:var(--color-foreground)] opacity-[0.05] dark:opacity-[0.08]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="sv-network"
            x="0"
            y="0"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="28" cy="28" r="1.25" fill="currentColor" />
            <line
              x1="28"
              y1="28"
              x2="84"
              y2="28"
              stroke="currentColor"
              strokeWidth="0.4"
              strokeDasharray="0.5 4"
            />
            <line
              x1="28"
              y1="28"
              x2="28"
              y2="84"
              stroke="currentColor"
              strokeWidth="0.4"
              strokeDasharray="0.5 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sv-network)" />
      </svg>

      <div
        className="absolute inset-0 opacity-60 dark:opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at top, transparent 40%, var(--color-background) 85%)",
        }}
      />
    </div>
  );
}
