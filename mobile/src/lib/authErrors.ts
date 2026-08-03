// Zentrale, enumeration-sichere Übersetzung von Supabase-Auth-Fehlern in
// nutzerlesbaren Text (ADR-0016). Zwei Regeln:
//
//  1. NIE verraten, ob eine Email existiert. „Falsches Passwort" und „Account
//     existiert nicht" liefern denselben generischen Satz — sonst wird der
//     Login zum Account-Enumeration-Orakel.
//  2. Die rohe `error.message` von supabase-js ist englisch, technisch und
//     wechselt zwischen Versionen. Wir mappen über den stabilen `error.code`
//     und fallen nur im Notfall auf die Message zurück.
//
// `authErrorCode()` gibt den rohen Code zurück, damit ein Screen auf Sonderfälle
// reagieren kann (z. B. „Email noch nicht bestätigt" → weiter zum Code-Screen),
// ohne die Message zu parsen.

import { AuthError } from '@supabase/supabase-js';

/** Der stabile Fehlercode, falls es ein Supabase-Auth-Fehler ist. */
export function authErrorCode(error: unknown): string | null {
  if (error instanceof AuthError) return error.code ?? null;
  return null;
}

const GENERIC = 'Something went wrong. Please try again.';

// Ein falsches Passwort und ein nicht existierender Account MÜSSEN denselben Text
// ergeben — daher teilen sich beide Codes diese eine Zeile.
const INVALID_CREDENTIALS = 'The email or password is incorrect.';

const MESSAGES: Record<string, string> = {
  invalid_credentials: INVALID_CREDENTIALS,
  user_not_found: INVALID_CREDENTIALS,
  email_not_confirmed: 'Confirm your email to continue — we sent you a code.',
  over_email_send_rate_limit: 'Too many requests. Please wait a minute and try again.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  otp_expired: 'That code has expired. Request a new one.',
  otp_disabled: 'That code isn’t valid anymore. Request a new one.',
  weak_password:
    'That password is too weak or has appeared in a data breach. Please choose a stronger one.',
  same_password: 'That’s already your password. Choose a different one.',
  signup_disabled: 'New sign-ups are currently disabled.',
  email_address_invalid: 'That email address doesn’t look right.',
  validation_failed: 'Please check the details and try again.',
  // Signup gegen eine bereits existierende Adresse ist neutral gehalten (kein
  // „existiert schon" — das wäre wieder Enumeration).
  user_already_exists: INVALID_CREDENTIALS,
  email_exists: INVALID_CREDENTIALS,
};

/**
 * Menschlicher Text zu einem beliebigen Fehler aus einem Auth-Aufruf.
 * Nicht-Auth-Fehler (Netz o. Ä.) bekommen den generischen Satz.
 */
export function mapAuthError(error: unknown): string {
  if (error instanceof AuthError) {
    const code = error.code ?? '';
    if (code in MESSAGES) return MESSAGES[code];

    // Ältere supabase-js-Versionen liefern für abgelaufene/falsche OTPs keinen
    // sauberen Code, aber eine erkennbare Message.
    if (/token has expired or is invalid|otp/i.test(error.message)) {
      return 'That code isn’t right. Check it and try again.';
    }
    // Vom Server durchgereichte, ungemappte Auth-Fehler: die Message ist
    // englisch und knapp genug, um sie zu zeigen — besser als ein generisches
    // Achselzucken.
    return error.message || GENERIC;
  }
  return GENERIC;
}
