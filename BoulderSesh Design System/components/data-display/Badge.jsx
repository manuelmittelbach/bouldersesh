import React from "react";

/**
 * BoulderSesh — Badge
 * Small status marker with optional icon. Tones map to functional colours.
 */
const tones = {
  neutral: { bg: "var(--surface-sunken)", fg: "var(--text-muted)" },
  success: { bg: "var(--success-surface)", fg: "var(--success-ink)" },
  warning: { bg: "var(--warning-surface)", fg: "var(--warning-ink)" },
  danger:  { bg: "var(--danger-surface)", fg: "var(--danger-ink)" },
  brand:   { bg: "var(--brand-soft)", fg: "var(--brand-soft-ink)" },
};

export function Badge({ children, tone = "neutral", icon = null, style, ...rest }) {
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: t.bg,
        color: t.fg,
        padding: "4px 9px",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-ui)",
        fontWeight: "var(--weight-semibold)",
        fontSize: "var(--text-2xs)",
        letterSpacing: "var(--tracking-snug)",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ display: "inline-flex", flex: "0 0 auto" }}>{icon}</span> : null}
      {children}
    </span>
  );
}
