# BoulderSesh

> An app for boulderers to meet up: post when/where/at what level you want to climb — others see it, match, chat, and climb.

BoulderSesh is a native iOS/Android app for spontaneously finding climbing partners at bouldering gyms. Users create sessions (gym, time, level, group size); others in the same city see them in the feed, send requests, and coordinate via chat.

## Structure (monorepo)

| Directory | Contents |
|---|---|
| [`mobile/`](mobile/) | The Expo app (React Native, iOS/Android). Has its own [README](mobile/README.md), [CLAUDE.md](mobile/CLAUDE.md), and `docs/`. |
| [`supabase/`](supabase/) | Backend: Postgres migrations, RLS policies, Realtime, email templates, and the `delete-account` edge function. |
| [`website/`](website/) | Hosted legal texts for [bouldersesh.com](https://bouldersesh.com) (imprint, privacy policy, terms) as static pages. |
| [`docs/`](docs/) | Architecture decisions ([ADRs](docs/adr/)) and [glossary](docs/glossary.md). |
| `BoulderSesh Design System/` | Design system (colors, typography, component templates). |
| `BoulderSesh_Konzept.md` | Original concept & product plan. |

## Tech stack

**App** — Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) · [NativeWind](https://www.nativewind.dev/) (Tailwind) · [TanStack Query](https://tanstack.com/query) · Google & Apple login

**Backend** — [Supabase](https://supabase.com) (Postgres, Auth, Realtime, Storage, Edge Functions)

## Development

The app lives in `mobile/`:

```bash
cd mobile
npm install
npm start          # Expo dev server
npm run ios        # iOS (simulator/dev build)
npm run android    # Android
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm test           # unit tests
```

> **Note:** The app uses native modules (Google Sign-In, notifications, …) and does **not** run in the App Store version of Expo Go. For device testing, use a dev build (`npm run ios`/`android`) or a simulator.

### Environment variables

Create `mobile/.env` based on [`mobile/.env.example`](mobile/.env.example) (Supabase URL & anon key). Real keys are **never** committed.

## Backend / database

Schema changes go exclusively through numbered migrations in [`supabase/migrations/`](supabase/migrations/) — never edit existing migrations after the fact, always add a new file. See [`supabase/`](supabase/) and the related [ADRs](docs/adr/) for details.

## Architecture decisions

Larger decisions are documented as ADRs in [`docs/adr/`](docs/adr/) (why Expo instead of web, city as an entity, auth flow, chat retention, and more). When tracing "why is it this way?" questions, look there first.

## Status

In active development · version 1.0.0.
