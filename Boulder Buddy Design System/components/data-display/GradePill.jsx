import React from "react";

/**
 * Boulder Buddy — GradePill
 * The climbing-grade chip. Mono numerals on a muted, cool band surface.
 * `band` picks the colour (beginner→pro); `grade` is the Fb-scale text.
 */
const bands = {
  beginner:     { bg: "var(--grade-beginner-surface)", fg: "var(--grade-beginner-ink)" },
  intermediate: { bg: "var(--grade-intermediate-surface)", fg: "var(--grade-intermediate-ink)" },
  advanced:     { bg: "var(--grade-advanced-surface)", fg: "var(--grade-advanced-ink)" },
  pro:          { bg: "var(--grade-pro-surface)", fg: "var(--grade-pro-ink)" },
  neutral:      { bg: "var(--surface-sunken)", fg: "var(--text-body)" },
};

const sizes = {
  sm: { fontSize: "var(--text-2xs)", padding: "3px 8px" },
  md: { fontSize: "var(--text-xs)", padding: "4px 10px" },
};

export function GradePill({ grade, band = "neutral", size = "md", style, ...rest }) {
  const b = bands[band] || bands.neutral;
  const s = sizes[size] || sizes.md;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: b.bg,
        color: b.fg,
        padding: s.padding,
        borderRadius: "var(--radius-xs)",
        fontFamily: "var(--font-mono)",
        fontWeight: "var(--weight-bold)",
        fontSize: s.fontSize,
        letterSpacing: "0",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {grade}
    </span>
  );
}
