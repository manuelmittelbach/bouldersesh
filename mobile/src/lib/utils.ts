import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Klassennamen zusammenführen — shadcn-Stil. Läuft mit NativeWind-Klassen. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Deutsche Wochentage/Monate hand-gerollt statt toLocaleDateString('de-DE'):
// Hermes hat auf Android unvollständige ICU-Locale-Daten → 'de-DE' liefert dort
// ggf. englische Namen. Diese Arrays sind deterministisch und plattform-identisch.
const WEEKDAYS_DE = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'] as const;
const MONTHS_DE = [
  'Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni',
  'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.',
] as const;

/** "Mo., 14. Juli" — kurzes deutsches Datum ohne Intl-Abhängigkeit. */
export function formatDateDE(d: Date): string {
  return `${WEEKDAYS_DE[d.getDay()]}, ${d.getDate()}. ${MONTHS_DE[d.getMonth()]}`;
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
 * sonst → Tag + Monat. Deterministisch (WEEKDAYS_DE/MONTHS_DE), kein toLocaleDateString —
 * siehe Kommentar oben zu Hermes/ICU.
 */
export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatClock(iso);
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return WEEKDAYS_DE[d.getDay()];
  return `${d.getDate()}. ${MONTHS_DE[d.getMonth()]}`;
}

/** UTC-Timestamp in ein kurzes deutsches Label formatieren, z. B. "Heute · 18:00". */
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

  if (isToday) return `Heute · ${time}`;
  if (isTomorrow) return `Morgen · ${time}`;
  return `${formatDateDE(d)} · ${time}`;
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
