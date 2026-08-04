// Dünne Wrapper um die supabase-auth-Aufrufe des Signup/Login-Flows (ADR-0016).
// Kein OAuth-Redirect, kein Magic-Link — Email-Verify und Passwort-Reset laufen
// über 8-stellige OTP-Codes (verifyOtp), also komplett ohne Deep-Linking.
//
// Die Funktionen werfen den ROHEN supabase-Fehler weiter; die aufrufende Seite
// übersetzt ihn über `mapAuthError()`/`authErrorCode()`. So bleibt hier die
// Enumeration-Sicherheit an einer Stelle (der Mapper), statt sie zu verteilen.

import { supabase } from '@/lib/supabase';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Account anlegen. Bei aktiver Email-Bestätigung (enable_confirmations) kommt
 * KEINE Session zurück — der Code-Screen übernimmt. `needsVerification` sagt der
 * UI, ob sie zum Verify-Screen weiterleiten muss.
 */
export async function signUp(
  email: string,
  password: string,
): Promise<{ needsVerification: boolean }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { needsVerification: !data.session };
}

/** Email-Bestätigung nach dem Signup — der 8-stellige Code aus der Mail. */
export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
  if (error) throw error;
}

/**
 * Recovery-Code prüfen. Erfolgreich → es entsteht eine Session; die App zeigt
 * dann (über das recoveryPending-Gate) den Neues-Passwort-Screen.
 */
export async function verifyRecoveryCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) throw error;
}

/**
 * Reset anstoßen — schickt einen Recovery-Code an die Email. Bewusst OHNE
 * `redirectTo`: mit dem `{{ .Token }}`-Template ist das eine reine Code-Mail,
 * kein Link. Unbekannte Adressen antwortet Supabase aus Enumeration-Schutz mit
 * Erfolg; nur echte Transportfehler werfen hier.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/** Signup-Code neu anfordern (Resend-Button auf dem Verify-Screen). */
export async function resendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/**
 * Email-Wechsel bestätigen — der 8-stellige Code aus der Mail an die NEUE Adresse.
 * `newEmail` ist die Zieladresse, an die updateUser({ email }) den Code geschickt hat;
 * verifyOtp prüft ihn genau gegen diese Adresse. Erfolgreich → GoTrue tauscht die Email
 * und feuert USER_UPDATED, useAuth zieht die neue `user.email` automatisch nach.
 *
 * Gilt nur bei ausgeschaltetem „Secure email change" (config.toml
 * double_confirm_changes = false): dann kommt EIN Code an die neue Adresse. Wäre es an,
 * kämen zwei Codes (alte + neue) und beide müssten bestätigt werden.
 */
export async function verifyEmailChangeCode(newEmail: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: newEmail, token, type: 'email_change' });
  if (error) throw error;
}

/** Email-Wechsel-Code neu anfordern (Resend-Button). Geht an die neue Adresse. */
export async function resendEmailChangeCode(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'email_change', email: newEmail });
  if (error) throw error;
}

/** Neues Passwort setzen — nutzt die aktuelle (Recovery-)Session, keine Email nötig. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
