// Passwort-Regeln an EINER Stelle. Industrie-Standard: EINE harte Grenze
// (Mindestlänge), sonst nur ein weicher Stärke-Hinweis — kein Zwang zu
// Sonderzeichen/Großbuchstaben. Die eigentliche Schwäche-/Leak-Prüfung macht
// Supabase serverseitig (Leaked-Password-Protection, ADR-0016); der Hinweis hier
// ist reines UI-Feedback beim Tippen.

/** Untergrenze für neue Passwörter (Signup + Reset + Account-Wechsel). */
export const MIN_PASSWORD = 8;

export type PasswordStrength = {
  /** 0..4 — füllt die Stärke-Leiste. */
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Too short' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  /** Unter der Mindestlänge — Submit bleibt gesperrt. */
  tooShort: boolean;
};

/**
 * Grobe, rein clientseitige Stärke-Schätzung aus Länge + Zeichen-Vielfalt.
 * Bewusst nachsichtig: ein langes Passphrase-Passwort ohne Sonderzeichen soll
 * gut abschneiden. Keine Ablehnung anhand dieses Scores — nur Färbung/Text.
 */
export function passwordStrength(pw: string): PasswordStrength {
  if (pw.length === 0) return { score: 0, label: 'Weak', tooShort: true };
  if (pw.length < MIN_PASSWORD) return { score: 0, label: 'Too short', tooShort: true };

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(pw),
  ).length;

  let raw = 1;
  if (pw.length >= 12) raw++;
  if (classes >= 2) raw++;
  if (classes >= 3 || pw.length >= 16) raw++;
  const score = Math.min(4, raw) as PasswordStrength['score'];

  const label = (['Weak', 'Weak', 'Fair', 'Good', 'Strong'] as const)[score];
  return { score, label, tooShort: false };
}
