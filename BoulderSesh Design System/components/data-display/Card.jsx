import React from "react";

/**
 * BoulderSesh — Card
 * The base surface: white, hairline border, 14px radius, low cool shadow.
 * Set `interactive` for the feed press-affordance (scale-down on press).
 */
export function Card({
  children,
  interactive = false,
  padding = "var(--space-4)",
  as = "div",
  style,
  onClick,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag
      onClick={onClick}
      style={{
        display: "block",
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding,
        textDecoration: "none",
        color: "inherit",
        cursor: interactive ? "pointer" : "default",
        transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      onMouseDown={interactive ? (e) => { e.currentTarget.style.transform = "scale(0.985)"; } : undefined}
      onMouseUp={interactive ? (e) => { e.currentTarget.style.transform = "scale(1)"; } : undefined}
      onMouseLeave={interactive ? (e) => { e.currentTarget.style.transform = "scale(1)"; } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
