import React from "react";

/**
 * BoulderSesh — Avatar
 * Initials avatar with a calm, cool tone set (no candy gradients). Optional
 * online dot. Falls back to a single letter.
 */
const sizes = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 88,
};

const tones = {
  rock:   { bg: "var(--rock-700)", fg: "#fff" },
  orange: { bg: "var(--orange-500)", fg: "#fff" },
  slate:  { bg: "#3a4252", fg: "#fff" },
  moss:   { bg: "#2f5d4a", fg: "#fff" },
  clay:   { bg: "#7a4a36", fg: "#fff" },
};

function toInitials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  initials,
  tone = "rock",
  size = "md",
  online = false,
  src,
  style,
  ...rest
}) {
  const dim = sizes[size] || sizes.md;
  const t = tones[tone] || tones.rock;
  const text = initials || toInitials(name);
  const fontSize = Math.round(dim * 0.4);
  const dot = Math.max(8, Math.round(dim * 0.24));

  return (
    <div style={{ position: "relative", width: dim, height: dim, flex: "0 0 auto", ...style }} {...rest}>
      <div
        style={{
          width: dim,
          height: dim,
          borderRadius: "var(--radius-pill)",
          background: src ? `center/cover no-repeat url(${src})` : t.bg,
          color: t.fg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: "var(--weight-semibold)",
          fontSize,
          letterSpacing: "var(--tracking-snug)",
          userSelect: "none",
        }}
      >
        {src ? null : text}
      </div>
      {online ? (
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: "var(--radius-pill)",
            background: "var(--success-ink)",
            border: "2px solid var(--surface-card)",
          }}
        />
      ) : null}
    </div>
  );
}
