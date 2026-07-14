import React from "react";

/**
 * Boulder Buddy — Chip
 * Pill-shaped filter / selection chip. Default = hairline on white,
 * active = ink fill (rock-900). Used in the feed filter bar and level pickers.
 */
export function Chip({
  children,
  active = false,
  icon = null,
  trailingIcon = null,
  onClick,
  as = "button",
  style,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag
      type={as === "button" ? "button" : undefined}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 36,
        padding: "0 14px",
        whiteSpace: "nowrap",
        borderRadius: "var(--radius-pill)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-snug)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)",
        background: active ? "var(--rock-900)" : "var(--surface-card)",
        color: active ? "var(--on-ink)" : "var(--text-body)",
        border: `1px solid ${active ? "var(--rock-900)" : "var(--border-default)"}`,
        ...style,
      }}
      {...rest}
    >
      {icon ? <span style={{ display: "inline-flex", flex: "0 0 auto", opacity: 0.9 }}>{icon}</span> : null}
      {children}
      {trailingIcon ? <span style={{ display: "inline-flex", flex: "0 0 auto", opacity: 0.7 }}>{trailingIcon}</span> : null}
    </Tag>
  );
}
