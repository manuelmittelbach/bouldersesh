/**
 * Simple feature flags for shipping unfinished features behind a toggle.
 * Read once at import time — set VITE_FF_* in your env.
 *
 * Add new flags here as you go. Pattern: VITE_FF_REALTIME_CHAT=true.
 */

function flag(name: string, fallback = false): boolean {
  const raw = import.meta.env[`VITE_FF_${name}`];
  if (typeof raw === "string") return raw.toLowerCase() === "true";
  return fallback;
}

export const featureFlags = {
  realtimeChat: flag("REALTIME_CHAT", false),
  groupSessions: flag("GROUP_SESSIONS", false),
  recurringSessions: flag("RECURRING_SESSIONS", false),
  outdoorCrags: flag("OUTDOOR_CRAGS", false),
} as const;

export type FeatureFlagName = keyof typeof featureFlags;
