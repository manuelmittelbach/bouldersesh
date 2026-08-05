import React from "react";

/**
 * BoulderSesh — MessageBubble
 * Chat bubble. `mine` = orange, right-aligned with a clipped bottom-right
 * corner; otherwise rock-100, left-aligned with a clipped bottom-left corner.
 */
export function MessageBubble({ children, mine = false, time, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}>
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-normal)",
          background: mine ? "var(--bubble-me-bg)" : "var(--bubble-them-bg)",
          color: mine ? "var(--bubble-me-ink)" : "var(--bubble-them-ink)",
          borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          ...style,
        }}
      >
        {children}
      </div>
      {time ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-faint)", padding: "0 2px" }}>
          {time}
        </span>
      ) : null}
    </div>
  );
}
