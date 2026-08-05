import React from "react";

/**
 * BoulderSesh — Button
 * Cool, confident, low-chrome. Primary = one bold orange hit per view.
 */
const sizes = {
  sm: { fontSize: "var(--text-sm)", padding: "8px 14px", height: 36, gap: 6, radius: "var(--radius-sm)" },
  md: { fontSize: "var(--text-base)", padding: "11px 18px", height: 44, gap: 8, radius: "var(--radius-md)" },
  lg: { fontSize: "var(--text-md)", padding: "14px 22px", height: 52, gap: 8, radius: "var(--radius-md)" },
};

const variants = {
  primary: {
    background: "var(--brand)",
    color: "var(--on-brand)",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--rock-900)",
    color: "var(--on-ink)",
    border: "1px solid transparent",
  },
  outline: {
    background: "transparent",
    color: "var(--text-strong)",
    border: "1px solid var(--border-default)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    border: "1px solid transparent",
  },
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  trailingIcon = null,
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const s = sizes[size] || sizes.md;
  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontFamily: "var(--font-ui)",
        fontSize: s.fontSize,
        fontWeight: "var(--weight-semibold)",
        lineHeight: 1,
        letterSpacing: "var(--tracking-snug)",
        borderRadius: s.radius,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), filter var(--dur-fast) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {icon ? <span style={{ display: "inline-flex", flex: "0 0 auto" }}>{icon}</span> : null}
      {children}
      {trailingIcon ? <span style={{ display: "inline-flex", flex: "0 0 auto" }}>{trailingIcon}</span> : null}
    </button>
  );
}
