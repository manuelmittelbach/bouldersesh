import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

// Account löschen (CONTEXT.md „Gelöschte Nutzer:in", ADR-0004). Der eigentliche
// Löschvorgang lebt in der Edge Function `delete-account` — nur sie hat den
// service_role-Key und kann die Bucket-Dateien anfassen. Hier steht der Flow
// drumherum: erneut das Passwort prüfen, die Function rufen, lokal abmelden.

/** Falsches Passwort bei der Bestätigung. Eigener Typ, damit die UI „Passwort
 *  stimmt nicht" von einem echten Serverfehler unterscheiden kann. */
export class ReauthFailedError extends Error {
  constructor() {
    super("That password doesn’t match. Try again.");
    this.name = "ReauthFailedError";
  }
}

// E-Mail und Passwort leben in Supabase Auth, nicht in `profiles`.
//
// E-Mail-Wechsel braucht KEINE erneute Passworteingabe: Supabase schützt ihn
// schon durch „Secure email change" — der Wechsel gilt erst nach Bestätigung
// über BEIDE Adressen (alte und neue). Wer am offenen Gerät sitzt, kann die
// E-Mail also ohnehin nicht heimlich übernehmen. Das ist der Konsumenten-App-
// Standard und erspart das iOS-Strong-Password-Feld am Screen.
//
// Passwort-Wechsel dagegen bleibt re-auth-pflichtig (signInWithPassword
// bestätigt, dass am Gerät wirklich diese Person sitzt); ReauthFailedError
// zeigt die UI als falsches Passwort direkt am Feld.

/** E-Mail ändern. Supabase schickt einen Bestätigungslink an die alte UND neue
 *  Adresse („Secure email change") — die E-Mail wechselt erst nach dem Klick,
 *  nicht sofort. */
export function useChangeEmail() {
  return useMutation({
    mutationFn: async ({ newEmail }: { newEmail: string }) => {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
  });
}

/** Passwort ändern. Wirkt sofort — die aktuelle Session bleibt gültig. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({
      email,
      currentPassword,
      newPassword,
    }: {
      email: string;
      currentPassword: string;
      newPassword: string;
    }) => {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) throw new ReauthFailedError();

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      // Erneute Passworteingabe (ADR-0004): signInWithPassword bestätigt, dass am
      // Gerät wirklich diese Person sitzt. Löschen ist endgültig, kein Undo.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (reauthError) throw new ReauthFailedError();

      // Die Function löscht zuerst die Bucket-Dateien, dann den Auth-User
      // (Reihenfolge ADR-0004). invoke hängt das aktuelle JWT automatisch an.
      const { error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
      });
      if (error) throw error;

      // Der Auth-User ist weg; die lokale Session ist damit wertlos. Nur lokal
      // abmelden — ein Server-Logout ginge gegen einen nicht mehr existierenden
      // User. onAuthStateChange feuert SIGNED_OUT → das Root-Gate zeigt Login.
      await supabase.auth.signOut({ scope: "local" });
    },
  });
}
