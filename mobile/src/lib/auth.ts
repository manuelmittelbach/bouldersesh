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

/** Neues Passwort setzen — nutzt die aktuelle (Recovery-)Session, keine Email nötig. */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
