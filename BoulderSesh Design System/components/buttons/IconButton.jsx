import React from "react";

/**
 * BoulderSesh — IconButton
 * Round, chromeless tap target for headers, nav and inline actions.
 */
const sizes = {
  sm: 36,
  md: 40,
  lg: 44,
};

const variants = {
  ghost: { background: "transparent", color: "var(--text-body)" },
  soft: { background: "var(--surface-sunken)", color: "var(--text-body)" },
  brand: { background: "var(--brand)", color: "var(--on-brand)" },
  ink: { background: "var(--rock-900)", color: "var(--on-ink)" },
};

export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  label,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const dim = sizes[size] || sizes.md;
  const v = variants[variant] || variants.ghost;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: "var(--radius-pill)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >
      {children}
    </button>
  );
}
