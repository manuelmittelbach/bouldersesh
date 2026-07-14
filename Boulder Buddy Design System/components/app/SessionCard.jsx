import React from "react";
import { Avatar } from "../data-display/Avatar.jsx";
import { GradePill } from "../data-display/GradePill.jsx";
import { Card } from "../data-display/Card.jsx";

/**
 * Boulder Buddy — SessionCard
 * The signature feed unit: who's climbing, when, where, at what grade.
 * Composes Avatar + GradePill + Card. Icons are passed in as nodes.
 */
function MetaRow({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: "var(--text-sm)", marginTop: 2 }}>
      <span style={{ display: "inline-flex", flex: "0 0 auto", opacity: 0.85 }}>{icon}</span>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    </div>
  );
}

export function SessionCard({
  name,
  avatarTone = "rock",
  grade,
  band = "neutral",
  time,
  gym,
  note,
  footer = null,
  timeIcon,
  gymIcon,
  online = false,
  onClick,
}) {
  return (
    <Card interactive={!!onClick} onClick={onClick} padding="var(--space-4)">
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={name} tone={avatarTone} size="md" online={online} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: "var(--weight-semibold)",
              fontSize: "var(--text-md)",
              letterSpacing: "var(--tracking-snug)",
              color: "var(--text-strong)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {name}
            </div>
            {grade ? <GradePill grade={grade} band={band} /> : null}
          </div>
          <MetaRow icon={timeIcon}>{time}</MetaRow>
          <MetaRow icon={gymIcon}>{gym}</MetaRow>
          {note ? (
            <div style={{
              marginTop: 8,
              color: "var(--text-body)",
              fontSize: "var(--text-sm)",
              lineHeight: "var(--leading-normal)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {note}
            </div>
          ) : null}
          {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
        </div>
      </div>
    </Card>
  );
}
