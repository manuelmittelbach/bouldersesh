import React from "react";

/**
 * Boulder Buddy — Input
 * Text field / textarea with optional eyebrow label and leading icon.
 * Cool, low-chrome: hairline border, 12px radius, orange focus ring.
 */
export function Input({
  label,
  icon = null,
  as = "input",
  hint,
  error,
  style,
  containerStyle,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const Tag = as === "textarea" ? "textarea" : "input";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label ? (
        <label
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-2xs)",
            fontWeight: "var(--weight-semibold)",
            letterSpacing: "var(--tracking-caps)",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </label>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: as === "textarea" ? "flex-start" : "center",
          gap: 8,
          background: "var(--surface-card)",
          border: `1px solid ${error ? "var(--danger-ink)" : focused ? "var(--brand)" : "var(--border-default)"}`,
          boxShadow: focused ? "0 0 0 3px var(--brand-soft)" : "none",
          borderRadius: "var(--radius-md)",
          padding: as === "textarea" ? "12px 14px" : "0 14px",
          height: as === "textarea" ? "auto" : 46,
          transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)",
        }}
      >
        {icon ? (
          <span style={{ color: "var(--text-faint)", display: "inline-flex", flex: "0 0 auto", marginTop: as === "textarea" ? 2 : 0 }}>
            {icon}
          </span>
        ) : null}
        <Tag
          {...rest}
          rows={as === "textarea" ? (rest.rows || 3) : undefined}
          onFocus={(e) => { setFocused(true); rest.onFocus && rest.onFocus(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur && rest.onBlur(e); }}
          style={{
            flex: 1,
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            resize: as === "textarea" ? "vertical" : undefined,
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            color: "var(--text-strong)",
            lineHeight: "var(--leading-normal)",
            padding: as === "textarea" ? 0 : "0",
            ...style,
          }}
        />
      </div>
      {error ? (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: "var(--danger-ink)" }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{hint}</span>
      ) : null}
    </div>
  );
}
