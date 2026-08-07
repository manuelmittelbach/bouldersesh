// Login-Methode eines Supabase-Users, gelesen aus app_metadata.provider.
// Der Account-Screen verzweigt daran: Social-Konten (Apple/Google) haben kein
// App-Passwort und ihre E-Mail verwaltet der Provider — die Zeilen Passwort/
// E-Mail-Ändern ergeben dort keinen Sinn.

export type SignInMethod = "apple" | "google" | "email";

/** Struktureller Ausschnitt des Supabase-Users — hält den Domain-Code frei von
 *  der supabase-js-Abhängigkeit. */
type UserLike = { app_metadata?: { provider?: unknown } } | null | undefined;

export function signInMethod(user: UserLike): SignInMethod {
  const provider = user?.app_metadata?.provider;
  if (provider === "apple" || provider === "google") return provider;
  return "email";
}
