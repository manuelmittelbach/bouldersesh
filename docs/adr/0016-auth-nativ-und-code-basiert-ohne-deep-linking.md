---
status: accepted
date: 2026-08-03
---

# Auth per nativem Social-Login + Email/Passwort, Verify & Reset per OTP-Code — bewusst ohne Deep-Linking

## Kontext & Entscheidung

Der Signup war bisher ein einziger Screen mit Email + Passwort und einem
Signin/Signup-Toggle (`mobile/src/app/login.tsx`), Email-Verifizierung war
abgeschaltet (`supabase/config.toml:32`, `enable_confirmations = false`), es gab
keinen Passwort-Reset und keinen Social-Login. Magic-Link war früher **bewusst
vermieden** worden, um sich Deep-Linking zu sparen (Kommentar in
`mobile/src/lib/supabase.ts`).

Für einen industrie-standard Signup braucht es Social-Login (Apple + Google),
verifizierte Emails und einen Recovery-Pfad. Der naheliegende Weg dahin —
Web-OAuth-Redirect und Magic-/Recovery-Links — würde genau das Deep-Linking
erzwingen, das wir vermeiden wollten (Universal Links, gehostete
`apple-app-site-association`, eigene Domain, plus die für uns unzuverlässigen
Redirect-Rückläufer im Simulator/Dev-Build-Setup).

**Entscheidung:** Wir gehen den **nativen, code-basierten** Weg und umgehen
Deep-Linking komplett:

- **Apple & Google nativ:** `expo-apple-authentication` bzw.
  `@react-native-google-signin/google-signin` liefern einen ID-Token, den wir an
  `supabase.auth.signInWithIdToken()` reichen. Kein Redirect, kein Deep-Link.
  Apple ist zwingend, sobald Google (irgendein Social-Login) angeboten wird
  (App-Store-Richtlinie).
- **Email/Passwort** bleibt als **Fallback** (nicht jeder hat/will Apple/Google),
  min. 8 Zeichen, Leaked-Password-Protection an, kein Komplexitäts-Zwang.
- **Email-Verify & Passwort-Reset per 6-stelligem OTP-Code** statt Link:
  Email-Template auf `{{ .Token }}`, kein `emailRedirectTo`; verifiziert über
  `verifyOtp()`. Bleibt in der App, kein Deep-Link.
- **Anmelde-Identität ist Email oder Social — nie ein Anzeigename.** Es gibt
  keinen eindeutigen Username (siehe `CONTEXT.md`, „Anzeigename"): Leute finden
  sich über Sessions, nicht über Namenssuche. `display_name` ist Pflicht beim
  Onboarding, aber frei und nicht eindeutig.
- **Onboarding als Identitäts-Gate** vor dem bestehenden City-Gate:
  Name\* → City\* → Skill (skip) → Avatar (skip). `skill_level` bleibt optional
  (Glossar unverändert).

## Betrachtete Alternativen (und warum verworfen)

- **Web-OAuth-Redirect + Magic-/Recovery-Links** — der „normale" Supabase-Weg.
  Verworfen: erzwingt Deep-Linking (Domain, Universal Links, gehostete
  Assoziationsdateien) und ist im Simulator/Dev-Build für Redirect-Rückläufer
  unzuverlässig — genau das, was `0001` und die bewusste Magic-Link-Vermeidung
  umgehen wollten.
- **Nur Social, kein Passwort** — verworfen: schließt Nutzer:innen ohne
  Apple/Google-Konto aus und macht uns von zwei Providern abhängig. Der
  Email-Fallback ist die Versicherung.
- **Login per selbst gewähltem Username** — verworfen: Supabase authentifiziert
  auf Email/Telefon, nicht auf beliebige Usernames; „Login mit Username" bräuchte
  eine eigene, für anon lesbare Lookup-Schicht → Account-Enumeration. Zudem hat
  ein Username keinen Recovery-Kanal.
- **Verify erst später erzwingen („rein lassen, dann nerven")** — verworfen: bei
  einer Kontakt-App mit echten Treffen und Chat dürfen unverifizierte (potenziell
  fake) Accounts nicht schon anfragen und schreiben. Das Verify-Gate ist die
  richtige Reibung, konsistent zum Safety-Fokus (Block/Report).
- **Captcha (Turnstile/hCaptcha) zum Launch** — verworfen: löst ein Bot-Problem,
  das wir noch nicht haben, kostet aber alle echten Nutzer Reibung. Supabase-
  Rate-Limits + Verify-Gate reichen; Captcha ist ein späterer Config-Toggle.

## Konsequenzen

- `enable_confirmations` wird **an**, Email-Templates werden auf `{{ .Token }}`
  umgestellt, Leaked-Password-Protection aktiviert — alles Supabase-Settings,
  kein Deep-Link-Setup.
- Externe Voraussetzungen, die der Code **nicht** ersetzt: **Apple Developer
  Account** (99 $/Jahr, für Apple-Sign-In + App Store), **Google Cloud OAuth
  Client-IDs** (iOS + Android), sowie gehostete **Terms/Privacy/Impressum**-
  Seiten (App-Store-Pflicht; die Domain wird dafür gebraucht — **nicht** fürs
  Deep-Linking). Bis dahin zeigen die ToS-Links auf Platzhalter-URLs.
- Fehlermeldungen werden zentral gemappt und **enumeration-sicher**: falsches
  Passwort und „Account existiert nicht" liefern denselben generischen Text.
- Das Profil wird weiterhin per Trigger mit nur `id` angelegt
  (`0001_initial.sql`); `display_name` bleibt in der DB **nullable** (die Zeile
  entsteht vor dem Onboarding) — die Pflicht wird **app-seitig** über das
  Identitäts-Gate erzwungen, nicht über einen NOT-NULL-Constraint.
- Getestet werden muss auf einem **echten Gerät (Dev-Build)** — native
  Apple/Google-Flows laufen im Simulator nicht zuverlässig.
