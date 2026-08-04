# BoulderSesh

> Eine App, in der sich Boulder:innen verabreden können: eintragen, wann/wo/auf welchem Level man klettern will — andere sehen es, matchen, chatten, klettern.

BoulderSesh ist eine native iOS/Android-App zum spontanen Finden von Kletterpartner:innen in Boulderhallen. Nutzer:innen erstellen Sessions (Halle, Zeit, Level, Gruppengröße), andere in derselben Stadt sehen sie im Feed, fragen an und stimmen sich per Chat ab.

## Aufbau (Monorepo)

| Verzeichnis | Inhalt |
|---|---|
| [`mobile/`](mobile/) | Die Expo-App (React Native, iOS/Android). Enthält eigene [README](mobile/README.md), [CLAUDE.md](mobile/CLAUDE.md) und `docs/`. |
| [`supabase/`](supabase/) | Backend: Postgres-Migrationen, RLS-Policies, Realtime, E-Mail-Templates und die `delete-account` Edge Function. |
| [`website/`](website/) | Gehostete Rechtstexte für [bouldersesh.com](https://bouldersesh.com) (Impressum, Datenschutz, AGB) als statische Seiten. |
| [`docs/`](docs/) | Architekturentscheidungen ([ADRs](docs/adr/)) und [Glossar](docs/glossary.md). |
| `Boulder Buddy Design System/` | Design-System (Farben, Typo, Komponenten-Vorlagen). |
| `Boulder-Buddy_Konzept.md` | Ursprüngliches Konzept & Produktplan. |

## Tech-Stack

**App** — Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) · [NativeWind](https://www.nativewind.dev/) (Tailwind) · [TanStack Query](https://tanstack.com/query) · Google- & Apple-Login

**Backend** — [Supabase](https://supabase.com) (Postgres, Auth, Realtime, Storage, Edge Functions)

## Entwicklung

Die App liegt in `mobile/`:

```bash
cd mobile
npm install
npm start          # Expo Dev-Server
npm run ios        # iOS (Simulator/Dev-Build)
npm run android    # Android
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm test           # Unit-Tests
```

> **Hinweis:** Die App nutzt native Module (Google-Sign-In, Notifications, …) und läuft **nicht** in der App-Store-Version von Expo Go. Für Gerätetests einen Dev-Build (`npm run ios`/`android`) oder Simulator verwenden.

### Umgebungsvariablen

`mobile/.env` anhand von [`mobile/.env.example`](mobile/.env.example) anlegen (Supabase-URL & Anon-Key). Echte Keys werden **nie** committet.

## Backend / Datenbank

Schema-Änderungen laufen ausschließlich über nummerierte Migrationen in [`supabase/migrations/`](supabase/migrations/) — bestehende Migrationen nie nachträglich editieren, immer eine neue Datei anlegen. Details siehe [`supabase/`](supabase/) und die zugehörigen [ADRs](docs/adr/).

## Architekturentscheidungen

Größere Entscheidungen sind als ADRs in [`docs/adr/`](docs/adr/) dokumentiert (Warum Expo statt Web, Stadt als Entität, Auth-Flow, Chat-Retention u. a.). Beim Nachvollziehen von „Warum ist das so?"-Fragen dort zuerst nachschauen.

## Status

In aktiver Entwicklung · Version 1.0.0 · privates Repository.
