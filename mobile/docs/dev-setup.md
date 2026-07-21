# Dev-Setup: App starten

## Simulator (Alltagsweg)

```bash
cd mobile
npx expo start --dev-client          # Terminal offen lassen
```

Zweites Terminal:

```bash
open -a Simulator                                          # nur falls keiner läuft
xcrun simctl launch booted de.manumittelbach.boulderbuddy
```

`xcrun simctl launch` umgeht den AppleScript-Pfad der Expo-CLI und damit den
Automation-Berechtigungs-Crash (siehe unten).

## iPhone

Einmalig einrichten:

1. iPhone per Kabel an den Mac, entsperrt, „Diesem Computer vertrauen".
2. `cd mobile && npx expo run:ios --device`
3. Am iPhone: Einstellungen → Allgemein → VPN & Geräteverwaltung → Entwickler-App → vertrauen.

Danach in jeder Session nur noch:

```bash
cd mobile
npx expo start --dev-client
```

… und die App „mobile" am Handy antippen. Kabel ist dann nicht mehr nötig, nur
gleiches WLAN wie der Mac.

## Regeln, die Zeit sparen

- **Immer erst Metro, dann App.** Der Dev-Build enthält keinen JS-Code, er lädt ihn vom Server.
- **Immer aus `mobile/`.** Im Repo-Root gibt es keine `package.json` → `ConfigError`.
- **Nicht `i` im Expo-Terminal drücken.** Löst `osascript ... exited with non-zero code: 1`
  (fehlende macOS-Automation-Berechtigung fürs Terminal) aus und reißt Metro mit runter.
  Dauerhafter Fix wäre Systemeinstellungen → Datenschutz & Sicherheit → Automation →
  Terminal → „System Events"; nötig ist er mit `simctl launch` aber nicht.
- **Nicht Expo Go öffnen.** Kann SDK 57 nicht laden (die SDK-57-Fassung hängt in Apples
  Review). Die eigene App heißt auf dem Homescreen „mobile",
  Bundle-ID `de.manumittelbach.boulderbuddy`; Expo Go ist `host.exp.Exponent` und sieht
  im Simulator fast gleich aus.
- **`npm run ios` / `run:ios` nur bei nativen Änderungen** (neues Native-Modul, `app.json`,
  Plugins). Sonst reicht Metro — JS-Änderungen kommen per Fast Refresh von selbst an.
- **WLAN vor dem Metro-Start hinstellen** — Expo ermittelt die LAN-IP einmalig beim Start
  und backt sie fest ein. Bei Gastnetz/AP-Isolation: `npx expo start --tunnel`.
- **iPhone-Build läuft nach 7 Tagen ab** (kostenloser Apple-Account) → dann
  `run:ios --device` wiederholen. Mit bezahltem Developer-Programm sind es 12 Monate.

## Login

Bestehende Accounts: `manumittelbach@live.de`, `manumittelbach@gmail.com`.
Neue Accounts gehen sofort über „Registrieren" — E-Mail-Bestätigung ist im
Supabase-Projekt aus, es kommt keine Mail.

## Nützliche Checks

```bash
lsof -nP -iTCP:8081 -sTCP:LISTEN     # läuft Metro?
xcrun simctl list devices booted     # welcher Simulator läuft?
xcrun simctl listapps booted         # ist der Dev-Build installiert?
xcrun xctrace list devices           # ist das iPhone verbunden?
```
