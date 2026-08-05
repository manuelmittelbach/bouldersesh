/* BoulderSesh UI kit — presentational primitives (self-contained, token-driven).
   Mirrors the authored design-system components; exported to window for the
   screen + app scripts. */

const { useState, useEffect, useRef } = React;

/* ---- Icon (Lucide) ----------------------------------------------------- */
function Icon({ name, size = 16, color, style }) {
  return <i data-lucide={name} style={{ width: size, height: size, color, display: "inline-flex", ...style }} />;
}
// Re-run lucide after every paint so dynamically-rendered icons hydrate.
function useLucide(dep) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

/* ---- Avatar ------------------------------------------------------------ */
const AV_TONES = {
  rock: "var(--rock-700)", orange: "var(--orange-500)", slate: "#3a4252",
  moss: "#2f5d4a", clay: "#7a4a36", pink: "#7a3656",
};
function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function Avatar({ name, initials: ini, tone = "rock", size = 44, online = false, style }) {
  const dot = Math.max(9, Math.round(size * 0.24));
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto", ...style }}>
      <div style={{
        width: size, height: size, borderRadius: "var(--radius-pill)", background: AV_TONES[tone] || AV_TONES.rock,
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 600, fontSize: Math.round(size * 0.4),
        letterSpacing: "-0.01em", userSelect: "none",
      }}>{ini || initials(name)}</div>
      {online && <span style={{
        position: "absolute", right: 0, bottom: 0, width: dot, height: dot, borderRadius: "var(--radius-pill)",
        background: "var(--success-ink)", border: "2px solid var(--surface-card)",
      }} />}
    </div>
  );
}

/* ---- GradePill --------------------------------------------------------- */
const BANDS = {
  beginner: ["var(--grade-beginner-surface)", "var(--grade-beginner-ink)"],
  intermediate: ["var(--grade-intermediate-surface)", "var(--grade-intermediate-ink)"],
  advanced: ["var(--grade-advanced-surface)", "var(--grade-advanced-ink)"],
  pro: ["var(--grade-pro-surface)", "var(--grade-pro-ink)"],
  neutral: ["var(--surface-sunken)", "var(--text-body)"],
};
function GradePill({ grade, band = "neutral", style }) {
  const [bg, fg] = BANDS[band] || BANDS.neutral;
  return <span style={{
    display: "inline-flex", alignItems: "center", background: bg, color: fg, padding: "4px 9px",
    borderRadius: "var(--radius-xs)", fontFamily: "var(--font-mono)", fontWeight: 700,
    fontSize: "var(--text-2xs)", lineHeight: 1.1, whiteSpace: "nowrap", ...style,
  }}>{grade}</span>;
}

/* ---- Badge ------------------------------------------------------------- */
const BADGE_TONES = {
  neutral: ["var(--surface-sunken)", "var(--text-muted)"],
  success: ["var(--success-surface)", "var(--success-ink)"],
  warning: ["var(--warning-surface)", "var(--warning-ink)"],
  danger: ["var(--danger-surface)", "var(--danger-ink)"],
  brand: ["var(--brand-soft)", "var(--brand-soft-ink)"],
};
function Badge({ children, tone = "neutral", icon, style }) {
  const [bg, fg] = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 4, background: bg, color: fg, padding: "4px 9px",
    borderRadius: "var(--radius-pill)", fontFamily: "var(--font-ui)", fontWeight: 600,
    fontSize: "var(--text-2xs)", lineHeight: 1.1, whiteSpace: "nowrap", ...style,
  }}>{icon && <Icon name={icon} size={13} />}{children}</span>;
}

/* ---- Button ------------------------------------------------------------ */
const BTN_SIZE = {
  sm: { h: 36, pad: "0 14px", fs: "var(--text-sm)", r: "var(--radius-sm)" },
  md: { h: 46, pad: "0 18px", fs: "var(--text-base)", r: "var(--radius-md)" },
  lg: { h: 52, pad: "0 22px", fs: "var(--text-md)", r: "var(--radius-md)" },
};
const BTN_VAR = {
  primary: { background: "var(--brand)", color: "#fff", border: "1px solid transparent" },
  secondary: { background: "var(--rock-900)", color: "var(--on-ink)", border: "1px solid transparent" },
  outline: { background: "transparent", color: "var(--text-strong)", border: "1px solid var(--border-default)" },
  ghost: { background: "transparent", color: "var(--text-body)", border: "1px solid transparent" },
};
function Button({ children, variant = "primary", size = "md", icon, trailingIcon, fullWidth, disabled, onClick, style }) {
  const s = BTN_SIZE[size], v = BTN_VAR[variant];
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{
        display: fullWidth ? "flex" : "inline-flex", width: fullWidth ? "100%" : "auto",
        alignItems: "center", justifyContent: "center", gap: 8, height: s.h, padding: s.pad,
        fontFamily: "var(--font-ui)", fontSize: s.fs, fontWeight: 600, letterSpacing: "-0.01em",
        borderRadius: s.r, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
        transition: "transform 120ms cubic-bezier(.22,1,.36,1)", WebkitTapHighlightColor: "transparent",
        ...v, ...style,
      }}>
      {icon && <Icon name={icon} size={16} />}{children}{trailingIcon && <Icon name={trailingIcon} size={16} />}
    </button>
  );
}

/* ---- IconButton -------------------------------------------------------- */
function IconButton({ name, label, onClick, variant = "ghost", size = 40, style }) {
  const v = {
    ghost: { background: "transparent", color: "var(--text-body)" },
    soft: { background: "var(--surface-sunken)", color: "var(--text-body)" },
    brand: { background: "var(--brand)", color: "#fff" },
    ink: { background: "var(--rock-900)", color: "#fff" },
  }[variant];
  return (
    <button type="button" aria-label={label} onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size,
        borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer",
        transition: "transform 120ms", WebkitTapHighlightColor: "transparent", ...v, ...style,
      }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </button>
  );
}

/* ---- Chip -------------------------------------------------------------- */
function Chip({ children, active, icon, trailingIcon, onClick, style }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", whiteSpace: "nowrap",
      borderRadius: "var(--radius-pill)", fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", fontWeight: 600,
      letterSpacing: "-0.01em", cursor: "pointer", WebkitTapHighlightColor: "transparent",
      transition: "background 120ms, border-color 120ms",
      background: active ? "var(--rock-900)" : "var(--surface-card)",
      color: active ? "var(--on-ink)" : "var(--text-body)",
      border: `1px solid ${active ? "var(--rock-900)" : "var(--border-default)"}`, ...style,
    }}>
      {icon && <Icon name={icon} size={15} />}{children}{trailingIcon && <Icon name={trailingIcon} size={15} />}
    </button>
  );
}

/* ---- Card -------------------------------------------------------------- */
function Card({ children, interactive, onClick, style, padding = "var(--space-4)" }) {
  return (
    <div onClick={onClick}
      onMouseDown={interactive ? (e) => (e.currentTarget.style.transform = "scale(0.985)") : undefined}
      onMouseUp={interactive ? (e) => (e.currentTarget.style.transform = "scale(1)") : undefined}
      onMouseLeave={interactive ? (e) => (e.currentTarget.style.transform = "scale(1)") : undefined}
      style={{
        background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)", padding, cursor: interactive ? "pointer" : "default",
        transition: "transform 120ms", WebkitTapHighlightColor: "transparent", ...style,
      }}>{children}</div>
  );
}

/* ---- MessageBubble ----------------------------------------------------- */
function MessageBubble({ children, mine, time }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", gap: 3 }}>
      <div style={{
        maxWidth: "80%", padding: "9px 13px", fontFamily: "var(--font-ui)", fontSize: "var(--text-base)",
        lineHeight: "var(--leading-normal)", background: mine ? "var(--bubble-me-bg)" : "var(--bubble-them-bg)",
        color: mine ? "var(--bubble-me-ink)" : "var(--bubble-them-ink)",
        borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
      }}>{children}</div>
      {time && <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-faint)", padding: "0 2px" }}>{time}</span>}
    </div>
  );
}

/* ---- BottomNav --------------------------------------------------------- */
function BottomNav({ items, active, onSelect }) {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-around", background: "var(--surface-card)",
      borderTop: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-nav)", padding: "10px 24px 14px",
    }}>
      {items.map((it) => {
        const on = it.key === active;
        return (
          <button key={it.key} type="button" onClick={() => onSelect(it.key)} style={{
            position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "transparent", border: "none", cursor: "pointer",
            color: on ? "var(--brand)" : "var(--text-faint)", WebkitTapHighlightColor: "transparent",
          }}>
            <Icon name={it.icon} size={23} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-2xs)", fontWeight: 600 }}>{it.label}</span>
            {it.badge && <span style={{
              position: "absolute", top: -1, right: "50%", marginRight: -15, width: 7, height: 7,
              borderRadius: "var(--radius-pill)", background: "var(--brand)", border: "1.5px solid var(--surface-card)",
            }} />}
          </button>
        );
      })}
    </nav>
  );
}

/* ---- StatusBar + PhoneFrame -------------------------------------------- */
function StatusBar({ dark }) {
  const c = dark ? "#fff" : "var(--text-strong)";
  return (
    <div style={{
      height: 50, padding: "16px 26px 0", display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: c, flex: "0 0 auto",
    }}>
      <span>9:41</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="signal" size={15} color={c} /><Icon name="wifi" size={15} color={c} /><Icon name="battery-full" size={20} color={c} />
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 390, height: 800, background: "var(--surface-card)", borderRadius: 46,
      border: "10px solid var(--rock-900)", boxShadow: "0 40px 80px -28px rgba(14,15,19,.5), 0 0 0 2px var(--rock-800) inset",
      overflow: "hidden", position: "relative", flex: "0 0 auto",
    }}>
      <div style={{
        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 116, height: 28,
        background: "var(--rock-900)", borderRadius: 16, zIndex: 50,
      }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, useLucide, Avatar, GradePill, Badge, Button, IconButton, Chip, Card,
  MessageBubble, BottomNav, StatusBar, PhoneFrame,
});
