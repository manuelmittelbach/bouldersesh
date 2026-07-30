import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { SkillLevel } from '@/types/database';

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

/** "Sat 25" — kompaktes Wochentag+Tag-Label für den dynamischen Datum-Chip. */
export function formatDayChip(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

/** Lokaler Kalendertag als "YYYY-MM-DD" — Schlüssel für react-native-calendars und
 *  den Vorauswahl-Param des Create-Flows. Bewusst lokal (kein toISOString, das UTC nimmt). */
export function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Wie viele Tage ab heute (inkl. heute) Sessions liegen dürfen. Gemeinsames Fenster für
 * Feed-Tagfilter und Create-Screen: heute..heute+(SESSION_DAY_WINDOW-1). Was man erstellen
 * kann, soll man im Feed auch wiederfinden — darum EINE Konstante für beide.
 */
export const SESSION_DAY_WINDOW = 30;

/** Kopie von `d` auf 00:00:00.000 desselben Kalendertags (lokale Zone). */
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Kopie von `d` auf 23:59:59.999 desselben Kalendertags (lokale Zone). */
export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// Gnadenfrist, die eine Session nach `starts_at` noch auf dem Feed hält (dayRange unten)
// UND zugleich die Grenze, ab der man den Plan nicht mehr absagen kann: bis hierher
// „Delete session"/„Leave session", danach nur noch „Leave chat" (still aus dem Chat).
// Eine Zahl, damit Feed-Sichtbarkeit und dieses Gate nie auseinanderdriften.
export const FEED_GRACE_MS = 60 * 60 * 1000;

/**
 * True, sobald die Session vom Feed gefallen ist — mehr als FEED_GRACE_MS nach `starts_at`.
 * Ab hier ist „Absagen" (Delete/Leave session) weg; es bleibt nur „Leave chat".
 */
export function hasLeftFeed(startsAt: string, now: Date = new Date()): boolean {
  return new Date(startsAt).getTime() < now.getTime() - FEED_GRACE_MS;
}

/**
 * Tages-Zeitfenster für den Feed-Filter als ISO-Strings. `toISOString()` schreibt den
 * korrekten UTC-Offset, deshalb rechnen wir die Grenzen in lokaler Gerätezeit.
 *
 * Ist `date` heute, beginnt das Fenster vor EINER STUNDE statt um Mitternacht —
 * eine gestartete Session bleibt so noch 1 h im Feed sichtbar (man kann kurz nach
 * Start noch mitklettern), fällt danach aber raus. An allen anderen Tagen umspannt
 * es den ganzen Kalendertag.
 *
 * Für „heute" wird der Startpunkt auf die volle Minute abgerundet: Sekunden/Millis
 * würden bei jedem Aufruf einen minimal anderen ISO-String liefern → jeder Today-Tap
 * ergäbe einen neuen React-Query-Key und damit einen unnötigen Refetch. Minutengenau
 * reicht völlig, um vergangene Sessions herauszufiltern.
 */
export function dayRange(date: Date): { from: string; to: string } {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  let from: Date;
  if (isToday) {
    from = new Date(now.getTime() - FEED_GRACE_MS);
    from.setSeconds(0, 0);
  } else {
    from = startOfDay(date);
  }
  return { from: from.toISOString(), to: endOfDay(date).toISOString() };
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

/**
 * UTC-Timestamp in ein kurzes Label formatieren, z. B. "Today · 18:00".
 *
 * `withDay: false` lässt den Tages-Präfix weg und gibt nur die Uhrzeit zurück — für den
 * Feed, der ohnehin auf genau einen Tag gefiltert ist (der Tag steht schon im Header).
 */
export function formatSessionTime(starts_at: string, opts: { withDay?: boolean } = {}): string {
  const { withDay = true } = opts;
  const d = new Date(starts_at);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const time = `${hh}:${mm}`;
  if (!withDay) return time;

  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

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

/**
 * Anzeige-Labels der Niveau-Bänder. Einzige Quelle — das Niveau erscheint jetzt am
 * Profil und, als Ersteller:innen-Pill, an Feed-Karte und Session-Detail.
 */
export const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};
export const SKILL_LEVELS = Object.keys(SKILL_LABEL) as SkillLevel[];

/** Label für ein optionales Niveau — `null`, wenn keins gesetzt ist (dann kein Pill). */
export function skillLabel(level: string | null | undefined): string | null {
  return level && level in SKILL_LABEL ? SKILL_LABEL[level as SkillLevel] : null;
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
