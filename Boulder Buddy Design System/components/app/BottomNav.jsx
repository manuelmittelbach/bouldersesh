import React from "react";

/**
 * Boulder Buddy — BottomNav
 * Fixed tab bar. Active tab is orange; others muted. Icons passed as nodes.
 */
export function BottomNav({ items = [], active, onSelect, style }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        background: "var(--surface-card)",
        borderTop: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-nav)",
        padding: "8px 24px calc(8px + env(safe-area-inset-bottom, 12px))",
        ...style,
      }}
    >
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onSelect && onSelect(it.key)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: isActive ? "var(--brand)" : "var(--text-faint)",
              WebkitTapHighlightColor: "transparent",
              transition: "color var(--dur-fast) var(--ease-out)",
            }}
          >
            <span style={{ display: "inline-flex" }}>{it.icon}</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-2xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-snug)" }}>
              {it.label}
            </span>
            {it.badge ? (
              <span style={{
                position: "absolute", top: -2, right: "50%", marginRight: -14,
                width: 7, height: 7, borderRadius: "var(--radius-pill)",
                background: "var(--brand)", border: "1.5px solid var(--surface-card)",
              }} />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
