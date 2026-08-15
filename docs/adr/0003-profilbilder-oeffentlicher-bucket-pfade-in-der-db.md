---
status: accepted
date: 2026-07-21
---

# Profilbilder liegen in einem öffentlichen Bucket, die DB speichert Pfade statt URLs

> **Nachtrag (2026-07-30):** Die **Galerie** ist in der App vorerst deaktiviert —
> UI und Hooks wurden entfernt, der vollständige Stand liegt auf dem Branch
> `feature/profile-gallery`. Die Spalte `gallery_paths` und die Storage-Policies
> bleiben unverändert; die Rückkehr ist ein reiner Code-Merge. Alles Übrige in
> diesem ADR (öffentlicher Bucket, Pfade statt URLs, Avatar-Flow) gilt unverändert.

> **Nachtrag (2026-08-15):** Die Mediathek-Berechtigung wird **nicht mehr aktiv
> angefragt** (WhatsApp/Instagram-Muster): Die System-Picker (iOS PHPicker,
> Android Photo Picker) laufen außerhalb der App und brauchen keine Berechtigung.
> Der frühere `requestMediaLibraryPermissionsAsync`-Prompt vor dem Picker löste
> bei „Zugriff beschränken" das System-Sheet „Fotos auswählen" aus, das mit dem
> Picker verwechselt wurde. Der Berechtigungstext (`photosPermission` in der
> app.json-Plugin-Config) bleibt als Absicherung bestehen.

## Kontext & Entscheidung

Nutzer:innen bekommen einen Avatar und eine Galerie (max. 6 Bilder). Avatare
erscheinen in Listen — Feed, Chat-Liste, Session-Detail — also potenziell
dutzendfach pro Screen. `profiles` ist per RLS ohnehin für **alle**
eingeloggten Nutzer lesbar (`0002_rls.sql:24`); ein strengerer Schutz auf den
Bildern wäre also Theater.

**Entscheidung:** Ein einziger **öffentlicher** Storage-Bucket `profile-images`.
Schreiben nur im eigenen Ordner (`{auth.uid()}/…`) per Storage-Policy, Lesen für
alle. Jeder Upload bekommt einen **neuen zufälligen Dateinamen**; das alte File
wird nach erfolgreichem DB-Update gelöscht.

In der DB stehen **Storage-Pfade, nicht URLs**: `profiles.avatar_path` (ersetzt
das nie befüllte `avatar_url`) und `profiles.gallery_paths text[]` mit
CHECK-Constraint auf max. 6 Einträge. Die öffentliche URL baut der Client per
`getPublicUrl()`.

## Betrachtete Alternativen (und warum verworfen)

- **Privater Bucket + signierte URLs** — verworfen: jede Feed-Zeile bräuchte eine
  Signier-Runde, `expo-image` kann ablaufende URLs nicht sinnvoll cachen, und der
  Schutz wäre gegenüber der bestehenden `profiles`-RLS rein kosmetisch.
- **Feste Dateipfade (`{uid}/avatar.jpg`) + `?v=`-Cache-Buster** — verworfen: Der
  Buster muss durch jede Komponente gereicht werden und schlägt den CDN-Cache tot.
  Ein neuer Dateiname pro Upload löst dasselbe Problem ohne Sonderfall.
- **Volle URLs in der DB** — verworfen: klebt die Projekt-Domain in jede Zeile.
  Mit Pfaden ist ein späterer Umstieg auf signierte URLs eine Code-Änderung statt
  einer Datenmigration — und genau diese Entscheidung ist die, die man revidieren
  könnte.
- **Eigene Tabelle `profile_photos`** — verworfen: Bei max. 6 Bildern ohne
  Eigenschaften pro Bild kostet sie neue RLS-Policies, eine Positionsspalte und
  eine eigene Query-Datei. `preferred_styles text[]` ist der Präzedenzfall im
  Schema. Wenn später Bildunterschriften oder Moderations-Flags kommen, ist die
  Migration klein.
- **Serverseitiges Verkleinern (Supabase Image Transformations)** — nicht
  verfügbar: das Feature ist Pro-Plan-only, das Projekt läuft auf Free. Deshalb
  wird **clientseitig** zugeschnitten, skaliert und als JPEG geschrieben
  (Avatar ~512px quadratisch, Galeriefoto ~1440px lange Kante) — das löst
  zugleich, dass iPhones HEIC liefern.

## Konsequenzen

- Wer eine Bild-URL kennt (weitergeleitet, geteilt), sieht das Bild **ohne
  Account** — dauerhaft, auch nach dem Abmelden.
- Wird ein Account gelöscht, räumt der Cascade auf `profiles` nur die Zeile ab —
  die Dateien im Bucket blieben liegen und öffentlich erreichbar. Deshalb löscht
  die Edge Function aus [ADR-0004](./0004-account-loeschen.md) die Dateien
  **zuerst** und den Account danach.
- Bilder speichern **sofort** beim Auswählen, unabhängig vom Save-Button des
  Profil-Formulars. Der Screen hat damit zwei Speicher-Modelle; die UI muss das
  sichtbar machen.
- Neue Native-Dependencies (`expo-image-picker`, `expo-image-manipulator`) →
  `app.json` braucht einen Mediathek-Berechtigungstext und der Dev-Build muss neu
  gebaut werden.
