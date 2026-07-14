/* @ds-bundle: {"format":3,"namespace":"BoulderBuddyDesignSystem_019e12","components":[{"name":"BottomNav","sourcePath":"components/app/BottomNav.jsx"},{"name":"MessageBubble","sourcePath":"components/app/MessageBubble.jsx"},{"name":"SessionCard","sourcePath":"components/app/SessionCard.jsx"},{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/data-display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data-display/Badge.jsx"},{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"GradePill","sourcePath":"components/data-display/GradePill.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"}],"sourceHashes":{"components/app/BottomNav.jsx":"424d0fbea715","components/app/MessageBubble.jsx":"5afbafe37a83","components/app/SessionCard.jsx":"88a0dcb99235","components/buttons/Button.jsx":"2cacb877b769","components/buttons/IconButton.jsx":"e22a8e12b84a","components/data-display/Avatar.jsx":"07731763c552","components/data-display/Badge.jsx":"156d73ac297f","components/data-display/Card.jsx":"cb4ae9ff975a","components/data-display/GradePill.jsx":"f06bf1433856","components/forms/Chip.jsx":"466f866c0202","components/forms/Input.jsx":"9c2b6f90fd21","ui_kits/boulder-buddy/app.jsx":"5650638ad44d","ui_kits/boulder-buddy/primitives.jsx":"30b748997c33","ui_kits/boulder-buddy/screens.jsx":"93c2d39f355f"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.BoulderBuddyDesignSystem_019e12 = window.BoulderBuddyDesignSystem_019e12 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/app/BottomNav.jsx
try { (() => {
/**
 * Boulder Buddy — BottomNav
 * Fixed tab bar. Active tab is orange; others muted. Icons passed as nodes.
 */
function BottomNav({
  items = [],
  active,
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-subtle)",
      boxShadow: "var(--shadow-nav)",
      padding: "8px 24px calc(8px + env(safe-area-inset-bottom, 12px))",
      ...style
    }
  }, items.map(it => {
    const isActive = it.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      onClick: () => onSelect && onSelect(it.key),
      style: {
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
        transition: "color var(--dur-fast) var(--ease-out)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex"
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-2xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-snug)"
      }
    }, it.label), it.badge ? /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -2,
        right: "50%",
        marginRight: -14,
        width: 7,
        height: 7,
        borderRadius: "var(--radius-pill)",
        background: "var(--brand)",
        border: "1.5px solid var(--surface-card)"
      }
    }) : null);
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/app/MessageBubble.jsx
try { (() => {
/**
 * Boulder Buddy — MessageBubble
 * Chat bubble. `mine` = orange, right-aligned with a clipped bottom-right
 * corner; otherwise rock-100, left-aligned with a clipped bottom-left corner.
 */
function MessageBubble({
  children,
  mine = false,
  time,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: mine ? "flex-end" : "flex-start",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "78%",
      padding: "9px 13px",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)",
      background: mine ? "var(--bubble-me-bg)" : "var(--bubble-them-bg)",
      color: mine ? "var(--bubble-me-ink)" : "var(--bubble-them-ink)",
      borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
      ...style
    }
  }, children), time ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-2xs)",
      color: "var(--text-faint)",
      padding: "0 2px"
    }
  }, time) : null);
}
Object.assign(__ds_scope, { MessageBubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/MessageBubble.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Button
 * Cool, confident, low-chrome. Primary = one bold orange hit per view.
 */
const sizes = {
  sm: {
    fontSize: "var(--text-sm)",
    padding: "8px 14px",
    height: 36,
    gap: 6,
    radius: "var(--radius-sm)"
  },
  md: {
    fontSize: "var(--text-base)",
    padding: "11px 18px",
    height: 44,
    gap: 8,
    radius: "var(--radius-md)"
  },
  lg: {
    fontSize: "var(--text-md)",
    padding: "14px 22px",
    height: 52,
    gap: 8,
    radius: "var(--radius-md)"
  }
};
const variants = {
  primary: {
    background: "var(--brand)",
    color: "var(--on-brand)",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--rock-900)",
    color: "var(--on-ink)",
    border: "1px solid transparent"
  },
  outline: {
    background: "transparent",
    color: "var(--text-strong)",
    border: "1px solid var(--border-default)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    border: "1px solid transparent"
  }
};
function Button({
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
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
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
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "scale(1)";
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto"
    }
  }, icon) : null, children, trailingIcon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto"
    }
  }, trailingIcon) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — IconButton
 * Round, chromeless tap target for headers, nav and inline actions.
 */
const sizes = {
  sm: 36,
  md: 40,
  lg: 44
};
const variants = {
  ghost: {
    background: "transparent",
    color: "var(--text-body)"
  },
  soft: {
    background: "var(--surface-sunken)",
    color: "var(--text-body)"
  },
  brand: {
    background: "var(--brand)",
    color: "var(--on-brand)"
  },
  ink: {
    background: "var(--rock-900)",
    color: "var(--on-ink)"
  }
};
function IconButton({
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
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    style: {
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
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = "scale(var(--press-scale))";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "scale(1)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "scale(1)";
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Avatar
 * Initials avatar with a calm, cool tone set (no candy gradients). Optional
 * online dot. Falls back to a single letter.
 */
const sizes = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 88
};
const tones = {
  rock: {
    bg: "var(--rock-700)",
    fg: "#fff"
  },
  orange: {
    bg: "var(--orange-500)",
    fg: "#fff"
  },
  slate: {
    bg: "#3a4252",
    fg: "#fff"
  },
  moss: {
    bg: "#2f5d4a",
    fg: "#fff"
  },
  clay: {
    bg: "#7a4a36",
    fg: "#fff"
  }
};
function toInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function Avatar({
  name,
  initials,
  tone = "rock",
  size = "md",
  online = false,
  src,
  style,
  ...rest
}) {
  const dim = sizes[size] || sizes.md;
  const t = tones[tone] || tones.rock;
  const text = initials || toInitials(name);
  const fontSize = Math.round(dim * 0.4);
  const dot = Math.max(8, Math.round(dim * 0.24));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      width: dim,
      height: dim,
      flex: "0 0 auto",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: dim,
      height: dim,
      borderRadius: "var(--radius-pill)",
      background: src ? `center/cover no-repeat url(${src})` : t.bg,
      color: t.fg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize,
      letterSpacing: "var(--tracking-snug)",
      userSelect: "none"
    }
  }, src ? null : text), online ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: dot,
      height: dot,
      borderRadius: "var(--radius-pill)",
      background: "var(--success-ink)",
      border: "2px solid var(--surface-card)"
    }
  }) : null);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Badge
 * Small status marker with optional icon. Tones map to functional colours.
 */
const tones = {
  neutral: {
    bg: "var(--surface-sunken)",
    fg: "var(--text-muted)"
  },
  success: {
    bg: "var(--success-surface)",
    fg: "var(--success-ink)"
  },
  warning: {
    bg: "var(--warning-surface)",
    fg: "var(--warning-ink)"
  },
  danger: {
    bg: "var(--danger-surface)",
    fg: "var(--danger-ink)"
  },
  brand: {
    bg: "var(--brand-soft)",
    fg: "var(--brand-soft-ink)"
  }
};
function Badge({
  children,
  tone = "neutral",
  icon = null,
  style,
  ...rest
}) {
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto"
    }
  }, icon) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Card
 * The base surface: white, hairline border, 14px radius, low cool shadow.
 * Set `interactive` for the feed press-affordance (scale-down on press).
 */
function Card({
  children,
  interactive = false,
  padding = "var(--space-4)",
  as = "div",
  style,
  onClick,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    onClick: onClick,
    style: {
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
      ...style
    },
    onMouseDown: interactive ? e => {
      e.currentTarget.style.transform = "scale(0.985)";
    } : undefined,
    onMouseUp: interactive ? e => {
      e.currentTarget.style.transform = "scale(1)";
    } : undefined,
    onMouseLeave: interactive ? e => {
      e.currentTarget.style.transform = "scale(1)";
    } : undefined
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/GradePill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — GradePill
 * The climbing-grade chip. Mono numerals on a muted, cool band surface.
 * `band` picks the colour (beginner→pro); `grade` is the Fb-scale text.
 */
const bands = {
  beginner: {
    bg: "var(--grade-beginner-surface)",
    fg: "var(--grade-beginner-ink)"
  },
  intermediate: {
    bg: "var(--grade-intermediate-surface)",
    fg: "var(--grade-intermediate-ink)"
  },
  advanced: {
    bg: "var(--grade-advanced-surface)",
    fg: "var(--grade-advanced-ink)"
  },
  pro: {
    bg: "var(--grade-pro-surface)",
    fg: "var(--grade-pro-ink)"
  },
  neutral: {
    bg: "var(--surface-sunken)",
    fg: "var(--text-body)"
  }
};
const sizes = {
  sm: {
    fontSize: "var(--text-2xs)",
    padding: "3px 8px"
  },
  md: {
    fontSize: "var(--text-xs)",
    padding: "4px 10px"
  }
};
function GradePill({
  grade,
  band = "neutral",
  size = "md",
  style,
  ...rest
}) {
  const b = bands[band] || bands.neutral;
  const s = sizes[size] || sizes.md;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      background: b.bg,
      color: b.fg,
      padding: s.padding,
      borderRadius: "var(--radius-xs)",
      fontFamily: "var(--font-mono)",
      fontWeight: "var(--weight-bold)",
      fontSize: s.fontSize,
      letterSpacing: "0",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), grade);
}
Object.assign(__ds_scope, { GradePill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/GradePill.jsx", error: String((e && e.message) || e) }); }

// components/app/SessionCard.jsx
try { (() => {
/**
 * Boulder Buddy — SessionCard
 * The signature feed unit: who's climbing, when, where, at what grade.
 * Composes Avatar + GradePill + Card. Icons are passed in as nodes.
 */
function MetaRow({
  icon,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto",
      opacity: 0.85
    }
  }, icon), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, children));
}
function SessionCard({
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
  onClick
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    interactive: !!onClick,
    onClick: onClick,
    padding: "var(--space-4)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    tone: avatarTone,
    size: "md",
    online: online
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-md)",
      letterSpacing: "var(--tracking-snug)",
      color: "var(--text-strong)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, name), grade ? /*#__PURE__*/React.createElement(__ds_scope.GradePill, {
    grade: grade,
    band: band
  }) : null), /*#__PURE__*/React.createElement(MetaRow, {
    icon: timeIcon
  }, time), /*#__PURE__*/React.createElement(MetaRow, {
    icon: gymIcon
  }, gym), note ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: "var(--text-body)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-normal)",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }
  }, note) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, footer) : null)));
}
Object.assign(__ds_scope, { SessionCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/SessionCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Chip
 * Pill-shaped filter / selection chip. Default = hairline on white,
 * active = ink fill (rock-900). Used in the feed filter bar and level pickers.
 */
function Chip({
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
  return /*#__PURE__*/React.createElement(Tag, _extends({
    type: as === "button" ? "button" : undefined,
    onClick: onClick,
    style: {
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
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto",
      opacity: 0.9
    }
  }, icon) : null, children, trailingIcon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      flex: "0 0 auto",
      opacity: 0.7
    }
  }, trailingIcon) : null);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Boulder Buddy — Input
 * Text field / textarea with optional eyebrow label and leading icon.
 * Cool, low-chrome: hairline border, 12px radius, orange focus ring.
 */
function Input({
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...containerStyle
    }
  }, label ? /*#__PURE__*/React.createElement("label", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-2xs)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: as === "textarea" ? "flex-start" : "center",
      gap: 8,
      background: "var(--surface-card)",
      border: `1px solid ${error ? "var(--danger-ink)" : focused ? "var(--brand)" : "var(--border-default)"}`,
      boxShadow: focused ? "0 0 0 3px var(--brand-soft)" : "none",
      borderRadius: "var(--radius-md)",
      padding: as === "textarea" ? "12px 14px" : "0 14px",
      height: as === "textarea" ? "auto" : 46,
      transition: "border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)"
    }
  }, icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      display: "inline-flex",
      flex: "0 0 auto",
      marginTop: as === "textarea" ? 2 : 0
    }
  }, icon) : null, /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    rows: as === "textarea" ? rest.rows || 3 : undefined,
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    },
    style: {
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
      ...style
    }
  }))), error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-xs)",
      color: "var(--danger-ink)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-xs)",
      color: "var(--text-faint)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// ui_kits/boulder-buddy/app.jsx
try { (() => {
/* Boulder Buddy UI kit — app shell: screen rail + phone + state machine. */

const {
  useState: useStateA,
  useEffect: useEffectA
} = React;
function ProfileScreen({
  go,
  setTab
}) {
  const styles = ["Power", "Dynamisch", "Technik"];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "8px 20px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-2xl)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)"
    }
  }, "Profil"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: "M",
    tone: "pink",
    size: 88
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-xl)",
      color: "var(--text-strong)",
      marginTop: 12
    }
  }, "Manu"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 3
    }
  }, "manu@boulder.cc"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(GradePill, {
    grade: "6b",
    band: "intermediate"
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    icon: "badge-check"
  }, "Verifiziert"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      color: "var(--text-strong)",
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 17,
    color: "var(--text-muted)"
  }), "Stamm-Halle"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)"
    }
  }, "M\xFCnchen-Ost")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-2xs)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-caps)",
      color: "var(--text-muted)",
      marginBottom: 10
    }
  }, "Boulder-Stil"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, styles.map(s => /*#__PURE__*/React.createElement(Chip, {
    key: s,
    active: true
  }, s))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    variant: "outline",
    onClick: () => go("auth")
  }, "Ausloggen"))), /*#__PURE__*/React.createElement(BottomNav, {
    active: "profile",
    onSelect: setTab,
    items: [{
      key: "home",
      label: "Home",
      icon: "house"
    }, {
      key: "chats",
      label: "Chats",
      icon: "message-circle",
      badge: true
    }, {
      key: "profile",
      label: "Profil",
      icon: "user"
    }]
  }));
}
const RAIL = [["auth", "Login"], ["dashboard", "Dashboard"], ["create", "Session anlegen"], ["detail", "Detail"], ["sent", "Anfrage"], ["chat", "Chat"], ["profile", "Profil"]];
function App() {
  const [screen, setScreen] = useStateA("auth");
  const [session, setSession] = useStateA(SESSIONS[0]);
  useEffectA(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  const go = s => setScreen(s);
  const openSession = s => {
    setSession(s);
    setScreen("detail");
  };
  const setTab = key => setScreen(key === "home" ? "dashboard" : key === "chats" ? "chat" : "profile");
  const tab = screen === "dashboard" ? "home" : screen === "chat" ? "chats" : screen === "profile" ? "profile" : "home";
  const screens = {
    auth: /*#__PURE__*/React.createElement(AuthScreen, {
      go: go
    }),
    dashboard: /*#__PURE__*/React.createElement(DashboardScreen, {
      go: go,
      openSession: openSession,
      tab: tab,
      setTab: setTab
    }),
    create: /*#__PURE__*/React.createElement(CreateScreen, {
      go: go
    }),
    detail: /*#__PURE__*/React.createElement(DetailScreen, {
      go: go,
      session: session
    }),
    sent: /*#__PURE__*/React.createElement(SentScreen, {
      go: go,
      session: session
    }),
    chat: /*#__PURE__*/React.createElement(ChatScreen, {
      go: go,
      session: session
    }),
    profile: /*#__PURE__*/React.createElement(ProfileScreen, {
      go: go,
      setTab: setTab
    })
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 760,
      padding: "26px 24px 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      background: "var(--brand)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mountain",
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "var(--text-lg)",
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-strong)",
      lineHeight: 1.1
    }
  }, "Boulder Buddy"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-2xs)",
      color: "var(--text-muted)"
    }
  }, "UI kit \xB7 klickbar"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap"
    }
  }, RAIL.map(([k, t]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => go(k),
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      padding: "7px 12px",
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      transition: "background 120ms",
      border: `1px solid ${screen === k ? "var(--rock-900)" : "var(--border-default)"}`,
      background: screen === k ? "var(--rock-900)" : "var(--surface-card)",
      color: screen === k ? "#fff" : "var(--text-body)"
    }
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 0 48px",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(PhoneFrame, null, screens[screen])));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/boulder-buddy/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/boulder-buddy/primitives.jsx
try { (() => {
/* Boulder Buddy UI kit — presentational primitives (self-contained, token-driven).
   Mirrors the authored design-system components; exported to window for the
   screen + app scripts. */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ---- Icon (Lucide) ----------------------------------------------------- */
function Icon({
  name,
  size = 16,
  color,
  style
}) {
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": name,
    style: {
      width: size,
      height: size,
      color,
      display: "inline-flex",
      ...style
    }
  });
}
// Re-run lucide after every paint so dynamically-rendered icons hydrate.
function useLucide(dep) {
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

/* ---- Avatar ------------------------------------------------------------ */
const AV_TONES = {
  rock: "var(--rock-700)",
  orange: "var(--orange-500)",
  slate: "#3a4252",
  moss: "#2f5d4a",
  clay: "#7a4a36",
  pink: "#7a3656"
};
function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function Avatar({
  name,
  initials: ini,
  tone = "rock",
  size = 44,
  online = false,
  style
}) {
  const dot = Math.max(9, Math.round(size * 0.24));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      flex: "0 0 auto",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: "var(--radius-pill)",
      background: AV_TONES[tone] || AV_TONES.rock,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: Math.round(size * 0.4),
      letterSpacing: "-0.01em",
      userSelect: "none"
    }
  }, ini || initials(name)), online && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: dot,
      height: dot,
      borderRadius: "var(--radius-pill)",
      background: "var(--success-ink)",
      border: "2px solid var(--surface-card)"
    }
  }));
}

/* ---- GradePill --------------------------------------------------------- */
const BANDS = {
  beginner: ["var(--grade-beginner-surface)", "var(--grade-beginner-ink)"],
  intermediate: ["var(--grade-intermediate-surface)", "var(--grade-intermediate-ink)"],
  advanced: ["var(--grade-advanced-surface)", "var(--grade-advanced-ink)"],
  pro: ["var(--grade-pro-surface)", "var(--grade-pro-ink)"],
  neutral: ["var(--surface-sunken)", "var(--text-body)"]
};
function GradePill({
  grade,
  band = "neutral",
  style
}) {
  const [bg, fg] = BANDS[band] || BANDS.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      background: bg,
      color: fg,
      padding: "4px 9px",
      borderRadius: "var(--radius-xs)",
      fontFamily: "var(--font-mono)",
      fontWeight: 700,
      fontSize: "var(--text-2xs)",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      ...style
    }
  }, grade);
}

/* ---- Badge ------------------------------------------------------------- */
const BADGE_TONES = {
  neutral: ["var(--surface-sunken)", "var(--text-muted)"],
  success: ["var(--success-surface)", "var(--success-ink)"],
  warning: ["var(--warning-surface)", "var(--warning-ink)"],
  danger: ["var(--danger-surface)", "var(--danger-ink)"],
  brand: ["var(--brand-soft)", "var(--brand-soft-ink)"]
};
function Badge({
  children,
  tone = "neutral",
  icon,
  style
}) {
  const [bg, fg] = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: bg,
      color: fg,
      padding: "4px 9px",
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-ui)",
      fontWeight: 600,
      fontSize: "var(--text-2xs)",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 13
  }), children);
}

/* ---- Button ------------------------------------------------------------ */
const BTN_SIZE = {
  sm: {
    h: 36,
    pad: "0 14px",
    fs: "var(--text-sm)",
    r: "var(--radius-sm)"
  },
  md: {
    h: 46,
    pad: "0 18px",
    fs: "var(--text-base)",
    r: "var(--radius-md)"
  },
  lg: {
    h: 52,
    pad: "0 22px",
    fs: "var(--text-md)",
    r: "var(--radius-md)"
  }
};
const BTN_VAR = {
  primary: {
    background: "var(--brand)",
    color: "#fff",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--rock-900)",
    color: "var(--on-ink)",
    border: "1px solid transparent"
  },
  outline: {
    background: "transparent",
    color: "var(--text-strong)",
    border: "1px solid var(--border-default)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-body)",
    border: "1px solid transparent"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  trailingIcon,
  fullWidth,
  disabled,
  onClick,
  style
}) {
  const s = BTN_SIZE[size],
    v = BTN_VAR[variant];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onMouseDown: e => !disabled && (e.currentTarget.style.transform = "scale(0.97)"),
    onMouseUp: e => e.currentTarget.style.transform = "scale(1)",
    onMouseLeave: e => e.currentTarget.style.transform = "scale(1)",
    style: {
      display: fullWidth ? "flex" : "inline-flex",
      width: fullWidth ? "100%" : "auto",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: s.h,
      padding: s.pad,
      fontFamily: "var(--font-ui)",
      fontSize: s.fs,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      borderRadius: s.r,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "transform 120ms cubic-bezier(.22,1,.36,1)",
      WebkitTapHighlightColor: "transparent",
      ...v,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16
  }), children, trailingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: trailingIcon,
    size: 16
  }));
}

/* ---- IconButton -------------------------------------------------------- */
function IconButton({
  name,
  label,
  onClick,
  variant = "ghost",
  size = 40,
  style
}) {
  const v = {
    ghost: {
      background: "transparent",
      color: "var(--text-body)"
    },
    soft: {
      background: "var(--surface-sunken)",
      color: "var(--text-body)"
    },
    brand: {
      background: "var(--brand)",
      color: "#fff"
    },
    ink: {
      background: "var(--rock-900)",
      color: "#fff"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    onClick: onClick,
    onMouseDown: e => e.currentTarget.style.transform = "scale(0.94)",
    onMouseUp: e => e.currentTarget.style.transform = "scale(1)",
    onMouseLeave: e => e.currentTarget.style.transform = "scale(1)",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: "var(--radius-pill)",
      border: "none",
      cursor: "pointer",
      transition: "transform 120ms",
      WebkitTapHighlightColor: "transparent",
      ...v,
      ...style
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: name,
    size: Math.round(size * 0.5)
  }));
}

/* ---- Chip -------------------------------------------------------------- */
function Chip({
  children,
  active,
  icon,
  trailingIcon,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 36,
      padding: "0 14px",
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-sm)",
      fontWeight: 600,
      letterSpacing: "-0.01em",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
      transition: "background 120ms, border-color 120ms",
      background: active ? "var(--rock-900)" : "var(--surface-card)",
      color: active ? "var(--on-ink)" : "var(--text-body)",
      border: `1px solid ${active ? "var(--rock-900)" : "var(--border-default)"}`,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15
  }), children, trailingIcon && /*#__PURE__*/React.createElement(Icon, {
    name: trailingIcon,
    size: 15
  }));
}

/* ---- Card -------------------------------------------------------------- */
function Card({
  children,
  interactive,
  onClick,
  style,
  padding = "var(--space-4)"
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseDown: interactive ? e => e.currentTarget.style.transform = "scale(0.985)" : undefined,
    onMouseUp: interactive ? e => e.currentTarget.style.transform = "scale(1)" : undefined,
    onMouseLeave: interactive ? e => e.currentTarget.style.transform = "scale(1)" : undefined,
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      padding,
      cursor: interactive ? "pointer" : "default",
      transition: "transform 120ms",
      WebkitTapHighlightColor: "transparent",
      ...style
    }
  }, children);
}

/* ---- MessageBubble ----------------------------------------------------- */
function MessageBubble({
  children,
  mine,
  time
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: mine ? "flex-end" : "flex-start",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "80%",
      padding: "9px 13px",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)",
      background: mine ? "var(--bubble-me-bg)" : "var(--bubble-them-bg)",
      color: mine ? "var(--bubble-me-ink)" : "var(--bubble-them-ink)",
      borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px"
    }
  }, children), time && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-2xs)",
      color: "var(--text-faint)",
      padding: "0 2px"
    }
  }, time));
}

/* ---- BottomNav --------------------------------------------------------- */
function BottomNav({
  items,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-subtle)",
      boxShadow: "var(--shadow-nav)",
      padding: "10px 24px 14px"
    }
  }, items.map(it => {
    const on = it.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      onClick: () => onSelect(it.key),
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: on ? "var(--brand)" : "var(--text-faint)",
        WebkitTapHighlightColor: "transparent"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 23
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-2xs)",
        fontWeight: 600
      }
    }, it.label), it.badge && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        top: -1,
        right: "50%",
        marginRight: -15,
        width: 7,
        height: 7,
        borderRadius: "var(--radius-pill)",
        background: "var(--brand)",
        border: "1.5px solid var(--surface-card)"
      }
    }));
  }));
}

/* ---- StatusBar + PhoneFrame -------------------------------------------- */
function StatusBar({
  dark
}) {
  const c = dark ? "#fff" : "var(--text-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 50,
      padding: "16px 26px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      fontWeight: 600,
      color: c,
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "signal",
    size: 15,
    color: c
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "wifi",
    size: 15,
    color: c
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "battery-full",
    size: 20,
    color: c
  })));
}
function PhoneFrame({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 800,
      background: "var(--surface-card)",
      borderRadius: 46,
      border: "10px solid var(--rock-900)",
      boxShadow: "0 40px 80px -28px rgba(14,15,19,.5), 0 0 0 2px var(--rock-800) inset",
      overflow: "hidden",
      position: "relative",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 12,
      left: "50%",
      transform: "translateX(-50%)",
      width: 116,
      height: 28,
      background: "var(--rock-900)",
      borderRadius: 16,
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }
  }, children));
}
Object.assign(window, {
  Icon,
  useLucide,
  Avatar,
  GradePill,
  Badge,
  Button,
  IconButton,
  Chip,
  Card,
  MessageBubble,
  BottomNav,
  StatusBar,
  PhoneFrame
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/boulder-buddy/primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/boulder-buddy/screens.jsx
try { (() => {
/* Boulder Buddy UI kit — screens. Uses window primitives from primitives.jsx. */

const {
  useState: useStateS
} = React;
const SESSIONS = [{
  id: "lina",
  name: "Lina Kessler",
  short: "Lina K.",
  tone: "orange",
  grade: "6a – 6c",
  band: "intermediate",
  when: "Heute · 18:00 – 21:00",
  gym: "Boulderwelt München-Ost",
  online: true,
  note: "Suche jemand zum Projekt-Bouldern. Versuche mich an einem 6c+ in der gelben Ecke.",
  foot: {
    tone: "success",
    icon: "circle-check-big",
    text: "Passt zu deinem Level"
  },
  years: "Klettert seit 3 Jahren · Power & Dynamisch"
}, {
  id: "tom",
  name: "Tom & Jana",
  short: "Tom & Jana",
  tone: "slate",
  grade: "5+ – 6a",
  band: "beginner",
  when: "Morgen · 19:30",
  gym: "Boulderwelt München-Ost",
  note: "Sind zu zweit, ein:e dritte:r ist noch frei. Locker, viel quatschen.",
  foot: {
    tone: "neutral",
    icon: "users",
    text: "1 / 2 Plätze frei"
  }
}, {
  id: "sami",
  name: "Sami Rahimi",
  short: "Sami R.",
  tone: "moss",
  grade: "7a+",
  band: "advanced",
  when: "Fr, 29. Mai · 17:00",
  gym: "Einstein Boulderhalle",
  note: "Power-Session. Suche jemand auf ähnlichem Niveau zum Spotten.",
  foot: {
    tone: "warning",
    icon: "arrow-up-right",
    text: "Stretch-Level"
  }
}, {
  id: "nora",
  name: "Nora Pohl",
  short: "Nora P.",
  tone: "clay",
  grade: "6b",
  band: "intermediate",
  when: "Sa, 30. Mai · 11:00",
  gym: "DAV Kletter- & Boulderzentrum",
  note: "Erstmal warm werden, dann Slabs. Tipps willkommen."
}];

/* Scroll region inside the phone */
function Body({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      overflowX: "hidden",
      ...style
    }
  }, children);
}
function Label({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-2xs)",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "var(--tracking-caps)",
      color: "var(--text-muted)",
      ...style
    }
  }, children);
}
const H = (s, w = 600) => ({
  fontFamily: "var(--font-display)",
  fontWeight: w,
  letterSpacing: "var(--tracking-snug)",
  color: "var(--text-strong)",
  fontSize: s
});

/* ---- AUTH -------------------------------------------------------------- */
function AuthScreen({
  go
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "8px 26px 26px",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      background: "var(--brand)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mountain",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(19, 700),
      letterSpacing: "var(--tracking-tight)"
    }
  }, "Boulder Buddy")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 56
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      ...H(30, 700),
      letterSpacing: "var(--tracking-tight)",
      lineHeight: "var(--leading-tight)",
      margin: 0
    }
  }, "Sag der App, wann du wohin gehst \u2014 sie zeigt dir, mit wem du klettern k\xF6nntest."), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 14,
      color: "var(--text-muted)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)"
    }
  }, "Gib deine E-Mail ein. Wir schicken dir einen Login-Link.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 26,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: "0 14px",
      height: 48
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 17,
    color: "var(--text-faint)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-strong)",
      fontSize: "var(--text-base)"
    }
  }, "manu@boulder.cc")), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    icon: "send",
    onClick: () => go("dashboard")
  }, "Login-Link senden")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-default)",
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-faint)",
      fontSize: "var(--text-xs)"
    }
  }, "oder"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-default)",
      flex: 1
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 22,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    variant: "outline",
    icon: "globe",
    onClick: () => go("dashboard")
  }, "Weiter mit Google"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    variant: "outline",
    icon: "apple",
    onClick: () => go("dashboard")
  }, "Weiter mit Apple")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      paddingTop: 26,
      textAlign: "center",
      color: "var(--text-faint)",
      fontSize: "var(--text-xs)"
    }
  }, "Mit dem Login akzeptierst du unsere Datenschutzerkl\xE4rung.")));
}

/* ---- DASHBOARD --------------------------------------------------------- */
function SessionCardRow({
  s,
  onClick
}) {
  return /*#__PURE__*/React.createElement(Card, {
    interactive: true,
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: s.name,
    tone: s.tone,
    size: 46,
    online: s.online
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(17),
      flex: "1 1 auto",
      minWidth: 0,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, s.short), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(GradePill, {
    grade: s.grade,
    band: s.band
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 14,
    style: {
      flex: "0 0 auto"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: "nowrap"
    }
  }, s.when)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14,
    style: {
      flex: "0 0 auto"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, s.gym)), s.note && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: "var(--text-body)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-normal)",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    }
  }, s.note), s.foot && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 11
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: s.foot.tone,
    icon: s.foot.icon
  }, s.foot.text)))));
}
function DashboardScreen({
  go,
  openSession,
  tab,
  setTab
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement(Body, {
    style: {
      paddingBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "6px 20px 12px",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "Heute \xB7 Mi, 27. Mai"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(30, 700),
      letterSpacing: "var(--tracking-tight)",
      marginTop: 2
    }
  }, "Wer klettert?")), /*#__PURE__*/React.createElement(Avatar, {
    initials: "M",
    tone: "pink",
    size: 42,
    onClick: () => setTab("profile"),
    style: {
      cursor: "pointer"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px 12px",
      display: "flex",
      gap: 8,
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement(Chip, {
    active: true,
    icon: "map-pin",
    trailingIcon: "chevron-down"
  }, "Boulderwelt M\xFCnchen"), /*#__PURE__*/React.createElement(Chip, {
    icon: "calendar"
  }, "Heute & morgen"), /*#__PURE__*/React.createElement(Chip, {
    icon: "trending-up"
  }, "Mein Level \xB1 1")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 20px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      paddingBottom: 16
    }
  }, SESSIONS.map(s => /*#__PURE__*/React.createElement(SessionCardRow, {
    key: s.id,
    s: s,
    onClick: () => openSession(s)
  })))), /*#__PURE__*/React.createElement(Button, {
    onClick: () => go("create"),
    style: {
      position: "absolute",
      right: 20,
      bottom: 92,
      width: 56,
      height: 56,
      borderRadius: "var(--radius-pill)",
      padding: 0,
      boxShadow: "var(--shadow-brand)",
      zIndex: 20
    },
    icon: null
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 26
  })), /*#__PURE__*/React.createElement(BottomNav, {
    active: tab,
    onSelect: setTab,
    items: [{
      key: "home",
      label: "Home",
      icon: "house"
    }, {
      key: "chats",
      label: "Chats",
      icon: "message-circle",
      badge: true
    }, {
      key: "profile",
      label: "Profil",
      icon: "user"
    }]
  }));
}

/* ---- CREATE ------------------------------------------------------------ */
function FieldBox({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: "12px 14px",
      ...style
    }
  }, children);
}
function CreateScreen({
  go
}) {
  const [day, setDay] = useStateS("heute");
  const [levels, setLevels] = useStateS({
    "6a": true,
    "6b": true,
    "6c": true
  });
  const lv = k => setLevels(p => ({
    ...p,
    [k]: !p[k]
  }));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 14px 8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "x",
    label: "Schlie\xDFen",
    onClick: () => go("dashboard")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(16)
    }
  }, "Neue Session"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40
    }
  })), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "8px 20px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    style: {
      marginBottom: 8
    }
  }, "Halle"), /*#__PURE__*/React.createElement(FieldBox, {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "var(--text-strong)",
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 16,
    color: "var(--text-muted)"
  }), "Boulderwelt M\xFCnchen-Ost"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    color: "var(--text-faint)"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    style: {
      marginBottom: 8
    }
  }, "Wann?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 8
    }
  }, [["heute", "Heute"], ["morgen", "Morgen"], ["datum", "Datum"]].map(([k, t]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setDay(k),
    style: {
      height: 46,
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-ui)",
      fontWeight: 600,
      fontSize: "var(--text-sm)",
      cursor: "pointer",
      border: `1px solid ${day === k ? "var(--brand)" : "var(--border-default)"}`,
      background: day === k ? "var(--brand)" : "var(--surface-card)",
      color: day === k ? "#fff" : "var(--text-body)"
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(FieldBox, {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-xs)"
    }
  }, "Start"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, "18:00")), /*#__PURE__*/React.createElement(FieldBox, {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-xs)"
    }
  }, "Ende"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 600,
      color: "var(--text-strong)"
    }
  }, "21:00")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    style: {
      marginBottom: 8
    }
  }, "Wunsch-Level"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, ["5+", "6a", "6b", "6c", "7a"].map(k => /*#__PURE__*/React.createElement(Chip, {
    key: k,
    active: !!levels[k],
    onClick: () => lv(k)
  }, k)), /*#__PURE__*/React.createElement(Chip, {
    icon: "infinity"
  }, "egal"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, {
    style: {
      marginBottom: 8
    }
  }, "Notiz ", /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: "none",
      letterSpacing: 0,
      color: "var(--text-faint)"
    }
  }, "(optional)")), /*#__PURE__*/React.createElement(FieldBox, {
    style: {
      color: "var(--text-faint)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-normal)",
      minHeight: 64
    }
  }, "z. B. \u201ESuche jemand zum Projekt-Bouldern an einem 6c+\""))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    icon: "send",
    onClick: () => go("dashboard")
  }, "Session ver\xF6ffentlichen")));
}

/* ---- DETAIL ------------------------------------------------------------ */
function InfoRow({
  icon,
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: "var(--radius-pill)",
      background: "var(--brand-soft)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    color: "var(--brand-soft-ink)"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-xs)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(15),
      fontWeight: 600
    }
  }, value)));
}
function DetailScreen({
  go,
  session
}) {
  const s = session || SESSIONS[0];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 14px 6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "arrow-left",
    label: "Zur\xFCck",
    onClick: () => go("dashboard")
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "more-horizontal",
    label: "Mehr"
  })), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "8px 20px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: s.name,
    tone: s.tone,
    size: 88,
    online: s.online
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(22, 700),
      marginTop: 12
    }
  }, s.short), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 3
    }
  }, s.years || "Boulder-Buddy"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(GradePill, {
    grade: s.grade,
    band: s.band
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    icon: "badge-check"
  }, "Verifiziert"))), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 22,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(InfoRow, {
    icon: "calendar",
    label: "Wann",
    value: s.when
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "map-pin",
    label: "Wo",
    value: s.gym
  }), /*#__PURE__*/React.createElement(InfoRow, {
    icon: "users",
    label: "Pl\xE4tze",
    value: "1 Buddy gesucht"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-lg)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(Label, {
    style: {
      marginBottom: 6
    }
  }, "Notiz"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-body)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-relaxed)"
    }
  }, s.note)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: "var(--success-ink)",
      fontSize: "var(--text-sm)",
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check-big",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "Passt zu deinem Level (6b) und deiner Stamm-Halle"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    icon: "hand",
    onClick: () => go("sent")
  }, "Klettern mit?")));
}

/* ---- SENT -------------------------------------------------------------- */
function SentScreen({
  go,
  session
}) {
  const s = session || SESSIONS[0];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "4px 14px 6px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "arrow-left",
    label: "Zur\xFCck",
    onClick: () => go("detail")
  }), /*#__PURE__*/React.createElement(IconButton, {
    name: "more-horizontal",
    label: "Mehr"
  })), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "8px 20px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 80,
      height: 80,
      borderRadius: "var(--radius-pill)",
      background: "var(--success-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "send",
    size: 34,
    color: "var(--success-ink)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(22, 700),
      marginTop: 18
    }
  }, "Anfrage gesendet"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-sm)",
      marginTop: 6,
      maxWidth: 270,
      lineHeight: "var(--leading-normal)"
    }
  }, s.short.split(" ")[0], " kriegt eine Push-Nachricht. Wenn sie zusagt, kann's losgehen.")), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 26,
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: s.name,
    tone: s.tone,
    size: 46
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(15),
      fontWeight: 600
    }
  }, s.short), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-muted)",
      fontSize: "var(--text-xs)",
      marginTop: 2
    }
  }, s.when.split(" · ")[0], " \xB7 ", s.gym)), /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    icon: "clock"
  }, "Wartet")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      display: "flex",
      gap: 12,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-lg)",
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lightbulb",
    size: 18,
    color: "var(--warning-ink)",
    style: {
      flex: "0 0 auto",
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-body)",
      fontSize: "var(--text-sm)",
      lineHeight: "var(--leading-normal)"
    }
  }, "Tipp: Schreib eine kurze Begr\xFC\xDFung mit, sobald ", s.short.split(" ")[0], " annimmt \u2014 Anfragen mit Nachricht werden 3\xD7 h\xE4ufiger zugesagt."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    variant: "secondary",
    icon: "arrow-left",
    onClick: () => go("dashboard")
  }, "Zur\xFCck zum Feed")));
}

/* ---- CHAT -------------------------------------------------------------- */
function ChatScreen({
  go,
  session
}) {
  const s = session || SESSIONS[0];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 10px 8px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderBottom: "1px solid var(--border-subtle)",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "arrow-left",
    label: "Zur\xFCck",
    onClick: () => go("dashboard")
  }), /*#__PURE__*/React.createElement(Avatar, {
    name: s.name,
    tone: s.tone,
    size: 40,
    online: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...H(15),
      fontWeight: 600
    }
  }, s.short), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      color: "var(--success-ink)",
      fontSize: "var(--text-xs)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--radius-pill)",
      background: "var(--success-ink)"
    }
  }), "Online")), /*#__PURE__*/React.createElement(IconButton, {
    name: "more-vertical",
    label: "Mehr",
    size: 36
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "12px 16px 0",
      background: "var(--brand-soft)",
      border: "1px solid var(--orange-100)",
      borderRadius: "var(--radius-md)",
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mountain",
    size: 15,
    color: "var(--brand-soft-ink)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: "var(--text-xs)",
      color: "var(--text-body)"
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-strong)"
    }
  }, "Heute 18:00"), " \xB7 ", s.gym), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      color: "var(--brand-soft-ink)"
    }
  }, "Details")), /*#__PURE__*/React.createElement(Body, {
    style: {
      padding: "16px 16px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-2xs)",
      color: "var(--text-faint)"
    }
  }, "HEUTE"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      background: "var(--surface-sunken)",
      color: "var(--text-muted)",
      fontSize: "var(--text-2xs)",
      padding: "5px 12px",
      borderRadius: "var(--radius-pill)"
    }
  }, "Ihr seid gematcht \u2014 viel Spa\xDF beim Klettern!")), /*#__PURE__*/React.createElement(MessageBubble, null, "Hey Manu! Cool, dass du Bock hast."), /*#__PURE__*/React.createElement(MessageBubble, {
    time: "9:42"
  }, "Bin um 18 Uhr am Empfang. Magst du dich davor noch warm machen oder zusammen?"), /*#__PURE__*/React.createElement(MessageBubble, {
    mine: true,
    time: "9:43"
  }, "Zusammen warm machen klingt gut!"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bubble-them-bg)",
      borderRadius: "16px 16px 16px 4px",
      padding: "11px 14px",
      display: "flex",
      gap: 4
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--radius-pill)",
      background: "var(--rock-400)",
      animation: `bbPulse 1s ${i * 0.15}s infinite`
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    name: "plus",
    label: "Anhang",
    variant: "soft",
    size: 38
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      padding: "10px 16px",
      color: "var(--text-faint)",
      fontSize: "var(--text-sm)"
    }
  }, "Nachricht \u2026"), /*#__PURE__*/React.createElement(IconButton, {
    name: "send",
    label: "Senden",
    variant: "brand",
    size: 38
  })));
}
Object.assign(window, {
  SESSIONS,
  AuthScreen,
  DashboardScreen,
  CreateScreen,
  DetailScreen,
  SentScreen,
  ChatScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/boulder-buddy/screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.MessageBubble = __ds_scope.MessageBubble;

__ds_ns.SessionCard = __ds_scope.SessionCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.GradePill = __ds_scope.GradePill;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Input = __ds_scope.Input;

})();
