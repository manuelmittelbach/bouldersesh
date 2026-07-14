/**
 * Simple Feature-Flags, um unfertige Features hinter einem Schalter auszuliefern.
 * Einmalig zur Build-Zeit gelesen — setze EXPO_PUBLIC_FF_* im .env.
 *
 * WICHTIG: Expo inlined nur STATISCH referenzierte EXPO_PUBLIC_*-Variablen. Der
 * dynamische `import.meta.env[`VITE_FF_${name}`]`-Trick aus der Web-Version
 * funktioniert hier NICHT — jedes Flag braucht eine eigene explizite Zeile.
 */

function parse(raw: string | undefined, fallback = false): boolean {
  if (typeof raw === 'string') return raw.toLowerCase() === 'true';
  return fallback;
}

export const featureFlags = {
  realtimeChat: parse(process.env.EXPO_PUBLIC_FF_REALTIME_CHAT, false),
  groupSessions: parse(process.env.EXPO_PUBLIC_FF_GROUP_SESSIONS, false),
  recurringSessions: parse(process.env.EXPO_PUBLIC_FF_RECURRING_SESSIONS, false),
  outdoorCrags: parse(process.env.EXPO_PUBLIC_FF_OUTDOOR_CRAGS, false),
} as const;

export type FeatureFlagName = keyof typeof featureFlags;
