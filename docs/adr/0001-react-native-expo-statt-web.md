---
status: accepted
date: 2026-07-14
---

# BoulderSesh wird als native App mit React Native (Expo) gebaut, nicht als Web-App

## Kontext & Entscheidung

Es existierte bereits ein lauffähiges Web-Frontend (Vite + React + TypeScript + Tailwind, als PWA konfiguriert) auf einem Supabase-Backend. Der Entwickler will jedoch eine **echt native App** (natives Gefühl, App-Store-Präsenz, native Push-Notifications) und hat in das bestehende Frontend bewusst kaum investiert — es gefällt ihm nicht und wird ohnehin neu gebaut. Damit entfällt das Hauptargument fürs Web/Capacitor ("wirf dein Frontend nicht weg").

**Entscheidung:** Das Frontend wird als native App mit **React Native** neu gebaut, über **Expo** (Managed Workflow) und **EAS** für Cloud-Builds und Store-Submission. Das **Supabase-Backend bleibt unverändert** (Postgres, RLS, Realtime, die bestehenden Migrations 0001–0005) und wird per `supabase-js` angebunden. Es gibt **keine** volle Web-Version der App — nur optional eine kleine, statische Landingpage (die zugleich als Deep-Link-Fallback für geteilte Session-Links dient).

## Betrachtete Alternativen (und warum verworfen)

- **Bestehende PWA behalten / erweitern** — verworfen: liefert nicht das gewünschte native Gefühl; iOS-PWA-Push ist wackelig; keine echte Store-Präsenz.
- **Capacitor** (bestehende Web-Codebase in native Hülle wrappen) — verworfen: sein einziger großer Vorteil ist "behalte deine Web-UI", und die wird hier ohnehin verworfen. Bliebe nur die "Web-in-der-Dose"-Seite (WebView-Rendering) ohne den Nutzen.
- **Flutter** — verworfen: erzwingt Dart und wirft das gesamte React/TypeScript-Wissen weg.
- **Swift + Kotlin (echt plattform-nativ)** — verworfen: zwei getrennte Codebases, zwei Sprachen, ~2–3× Aufwand für Solo-Entwickler; die Performance-/Fidelity-Vorteile löst eine "Karten + Listen + Chat + Formulare"-App nie ein.

React Native + Expo ist der einzige Weg, der echt-nativ (Store, native Push/Kamera, natives Rendering) liefert **und** TypeScript/React, `supabase-js`, React Query, Zod, die bestehende Query-Schicht sowie die Design-Tokens erhält.

## Konsequenzen

- **Bleibt / portiert:** Backend 1:1; die Query-Schicht (`src/queries/*`, React Query, Zod-Schemas, Typen) fast unverändert; die Marken-**Tokens** des Design Systems (Send Orange `#f25c16`, Rock-Neutrals, Space Grotesk / Inter / JetBrains Mono, Radien, Motion) als Theme.
- **Wird neu gebaut:** Die ~11 Design-System-Komponenten (aktuell Web-React + CSS) müssen in RN-Primitiven (`View`/`Text`/`Pressable`) nachgebaut werden; alle App-Screens.
- **Neue native Bausteine:** `expo-notifications` (Push), `expo-image-picker`/`expo-camera` (Profilfoto), `expo-font`, `expo-auth-session`/Deep-Linking (Supabase Magic Links), `expo-secure-store`.
- **Styling:** **NativeWind** (Tailwind für RN) — die Marken-Tokens wandern in eine `tailwind.config`, `className`-Ergonomie bleibt wie im Web.
- **Repo & Salvage:** Zuerst `git init` + Commit des Ist-Zustands (Sicherheitsnetz). Dann frisches Expo-Projekt in `mobile/` neben dem alten `app/`, nicht in-place. Migrations werden auf ein Top-Level `supabase/` hochgezogen; `src/queries/*`, `src/types/database.ts`, Token-Config und `.env` werden rübergerettet; die alte Vite/PWA-Web-Schale wird nach dem Ausschlachten entfernt.
- **Offen (echtes Downstream-Detail):** Deep-Link-/Magic-Link-Handling für Auth und geteilte Session-Links.
