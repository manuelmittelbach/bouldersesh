import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Klassennamen zusammenführen — shadcn-Stil. Läuft mit NativeWind-Klassen. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Wochentage/Monate hand-gerollt statt toLocaleDateString('en-US'): Hermes hat auf
// Android unvollständige ICU-Locale-Daten → Ergebnisse können plattformabhängig
// abweichen. Diese Arrays sind deterministisch und plattform-identisch.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** "Mon, Jul 14" — kurzes Datum ohne Intl-Abhängigkeit. */
export function formatDateShort(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "HH:MM" — reine Uhrzeit aus einem UTC-Timestamp (lokale Zone). */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Kompakter Zeitstempel für eine Chat-Zeile: heute → Uhrzeit, diese Woche → Wochentag,
 * sonst → Monat + Tag. Deterministisch (WEEKDAYS/MONTHS), kein toLocaleDateString —
 * siehe Kommentar oben zu Hermes/ICU.
 */
export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatClock(iso);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return WEEKDAYS[d.getDay()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** UTC-Timestamp in ein kurzes Label formatieren, z. B. "Today · 18:00". */
export function formatSessionTime(starts_at: string): string {
  const d = new Date(starts_at);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return `${formatDateShort(d)} · ${time}`;
}

/** Initialen-Fallback für Avatare aus dem Vornamen bauen. */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Ruhige, kühle Avatar-Töne (keine Bonbon-Gradienten). Siehe DS Avatar. */
export type AvatarTone = 'rock' | 'orange' | 'slate' | 'moss' | 'clay';
const AVATAR_TONES: AvatarTone[] = ['rock', 'slate', 'moss', 'clay', 'orange'];

/** Deterministischen Avatar-Ton aus einem Seed (Name/ID) wählen, damit er stabil bleibt. */
export function avatarTone(seed: string | null | undefined): AvatarTone {
  if (!seed) return 'rock';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/** Skill-Level auf ein Grade-Pill-Farbband mappen. */
export type GradeBand = 'beginner' | 'intermediate' | 'advanced' | 'pro' | 'neutral';
export function gradeBand(level: string | null | undefined): GradeBand {
  switch (level) {
    case 'beginner':
    case 'intermediate':
    case 'advanced':
    case 'pro':
      return level;
    default:
      return 'neutral';
  }
}
