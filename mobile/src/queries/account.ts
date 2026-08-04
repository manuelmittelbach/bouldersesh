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
// E-Mail-Wechsel ist re-auth-pflichtig und bestätigt nur die NEUE Adresse — der
// Industrie-Standard (Google/GitHub/Apple): wer das Passwort kennt UND das neue
// Postfach kontrolliert, darf wechseln; die alte Adresse muss NICHT zustimmen.
// „Secure email change" ist dafür bewusst AUS (config.toml
// double_confirm_changes = false), sonst kämen zwei Codes und der Wechsel bräche,
// sobald jemand den Zugriff aufs alte Postfach verloren hat.
//
// Wie beim Passwort-Wechsel bestätigt signInWithPassword, dass am Gerät wirklich
// diese Person sitzt; ReauthFailedError zeigt die UI als falsches Passwort direkt
// am Feld. Der eigentliche Wechsel greift erst nach dem Code aus der neuen Mail
// (verifyEmailChangeCode, siehe lib/auth.ts) — updateUser stößt ihn nur an.

/** E-Mail ändern. Erst re-auth (falsches Passwort → ReauthFailedError), dann
 *  updateUser({ email }): Supabase schickt einen 8-stelligen Code an die NEUE
 *  Adresse. Die E-Mail wechselt erst, wenn dieser Code bestätigt ist. */
export function useChangeEmail() {
  return useMutation({
    mutationFn: async ({
      email,
      currentPassword,
      newEmail,
    }: {
      email: string;
      currentPassword: string;
      newEmail: string;
    }) => {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) throw new ReauthFailedError();

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
