"use client";

/**
 * The "is talking" indicator.
 *
 * Deliberately CSS/SVG only — NOT a 3D avatar. CLAUDE.md fixes the site at ONE
 * WebGL scene (the ambient logo), and a second live canvas would break that
 * budget, hurt mid-range phones, and delay first paint. This gives the same
 * "it's alive" cue for a few hundred bytes and animates on the compositor
 * (transform/opacity only), so it never causes layout work.
 *
 * Honours prefers-reduced-motion via `motion-safe:`.
 */
export function SpeakingOrb({
  speaking,
  listening,
}: {
  speaking: boolean;
  listening: boolean;
}) {
  const active = speaking || listening;
  const label = listening ? "Listening" : speaking ? "Speaking" : "Idle";

  return (
    <span
      className="relative inline-flex size-6 items-center justify-center"
      role="img"
      aria-label={label}
    >
      {/* Outer ring pulses only while active. */}
      <span
        className={[
          "absolute inset-0 rounded-full",
          active ? "bg-brand-indigo/30 motion-safe:animate-ping" : "bg-transparent",
        ].join(" ")}
        aria-hidden
      />
      {/* Core dot: indigo when speaking, warmer when listening. */}
      <span
        className={[
          "relative rounded-full transition-all duration-300",
          listening ? "bg-emerald-400" : "bg-brand-indigo",
          active ? "size-3" : "size-2 opacity-70",
        ].join(" ")}
        aria-hidden
      />
    </span>
  );
}

/** Equaliser bars shown next to a message the bot is currently reading aloud. */
export function SpeakingBars() {
  return (
    <span className="inline-flex items-end gap-0.5" aria-hidden>
      {[0, 120, 240].map((delay, i) => (
        <span
          key={delay}
          className="bg-brand-indigo-2 w-0.5 rounded-full motion-safe:animate-pulse"
          style={{
            height: `${6 + i * 3}px`,
            animationDelay: `${delay}ms`,
            animationDuration: "700ms",
          }}
        />
      ))}
    </span>
  );
}
