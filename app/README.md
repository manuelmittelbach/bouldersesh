# Boulder Buddy

Eine App, in der sich Boulder:innen verabreden können. Stack: Vite + React + TypeScript + Tailwind + Supabase + TanStack Query + React Router + PWA. Übernimmt die Patterns aus `bar-happenings-berlin` (siehe `../Lessons-from-bar-happenings.md`).

---

## Was du bekommst

Ein lauffähiges Grundgerüst:

- **Auth** via Magic Link (Supabase) inkl. `AuthCallbackGate`
- **Dashboard** mit echter Query auf `sessions` (TanStack Query)
- **Session anlegen** mit React Hook Form + Zod-Validierung
- **Session-Detail** mit „Klettern mit?"-Anfrage
- **Chat** mit Realtime-Subscription (Patch-in-Cache statt invalidate, siehe Lessons §3.3)
- **PWA**-Setup via `vite-plugin-pwa`
- Routen sind **lazy** geladen — Bundle-Größe bleibt klein
- Queries pro Domain in `src/queries/*.ts` — keine Mega-Datei
- **Supabase-Migrationen** für alle MVP-Tabellen + **RLS-Policies**

Was bewusst **nicht** drin ist (kommt mit den nächsten Iterationen):

- Onboarding/Profil-Setup-Flow (Avatar-Upload, Level-Picker)
- Chat-Liste (ist nur ein Placeholder)
- Friends-only Sessions, Gruppen-Sessions, Recurring Sessions
- shadcn/ui — Komponenten sind aktuell inline mit Tailwind. Wenn du Forms / Dialogs / Toasts brauchst: `npx shadcn@latest init` und dann das Add-CLI.

---

## Setup (ca. 15 Minuten)

### 1. Supabase-Projekt anlegen

1. Auf [app.supabase.com](https://app.supabase.com) ein neues Projekt erstellen.
2. Unter **Settings → API** zwei Werte kopieren:
   - **Project URL**
   - **`anon` public key**

### 2. ENV-Datei

```bash
cp .env.example .env.local
# .env.local mit den beiden Supabase-Werten füllen
```

### 3. Migrationen einspielen

**Variante A: Supabase CLI (empfohlen)**

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <dein-project-ref>
supabase db push   # spielt 0001_initial.sql + 0002_rls.sql ein
psql "$(supabase db url)" -f supabase/seed.sql   # optional: 4 Münchner Hallen
```

**Variante B: SQL-Editor**

`supabase/migrations/0001_initial.sql` und `0002_rls.sql` im Supabase Dashboard → **SQL Editor** nacheinander einfügen und ausführen. Anschließend `supabase/seed.sql` für die Dummy-Hallen.

### 4. Auth-Konfiguration im Dashboard

**Authentication → URL Configuration:**

- **Site URL**: `http://localhost:5173`
- **Redirect URLs**: `http://localhost:5173/auth/callback`

(Später für Production die echte Domain ergänzen, nicht ersetzen.)

### 5. App starten

```bash
pnpm install        # oder npm / yarn
pnpm dev
```

Open `http://localhost:5173`, gib eine E-Mail-Adresse ein, klick den Magic Link, fertig.

### 6. Generierte Typen (optional, aber empfohlen)

`src/types/database.ts` ist von Hand geschrieben. Sobald du Migrationen geändert hast, lieber die echten Supabase-Typen ziehen:

```bash
pnpm supabase:types
```

Das überschreibt die Datei mit dem, was Supabase wirklich sieht — Drift zwischen Schema und Code vermieden.

---

## Projekt-Struktur

```
app/
├── src/
│   ├── components/        # AuthCallbackGate, BottomNav, SessionCard, PageLoader, ProtectedRoute
│   ├── hooks/             # useAuth (ported from bar-happenings)
│   ├── lib/               # supabase client, queryClient, utils, featureFlags
│   ├── pages/             # Auth, AuthCallback, Dashboard, SessionCreate, SessionDetail, Chat, ChatList, Profile, NotFound
│   ├── queries/           # profiles, sessions, matches, chat, gyms — eine Datei pro Domain
│   ├── types/             # database.ts (Supabase types)
│   ├── App.tsx            # Router mit Lazy-Loading
│   ├── main.tsx           # QueryClientProvider, BrowserRouter
│   └── index.css          # Tailwind base + globals
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial.sql   # Schema
│   │   └── 0002_rls.sql       # Row-Level Security
│   ├── config.toml
│   └── seed.sql               # Dummy-Hallen für lokales Testen
├── public/                # PWA Icons
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts          # mit vite-plugin-pwa
└── README.md
```

---

## Roadmap nächste Schritte

Direkt aus dem `Boulder-Buddy_Konzept.md` Abschnitt 7, jetzt mit Status-Tracking:

| Phase | Status | Was fehlt |
|---|---|---|
| 0. Setup | ✅ | — |
| 1. Auth + Profile | 🟡 | Profil-Setup-Flow (Name, Level, Avatar) noch nicht |
| 2. Sessions + Feed | 🟡 | Filter-State (Halle/Datum/Level) noch nicht im URL persistiert |
| 3. Match-Anfragen | 🟡 | Eingehende Anfragen für Session-Creator-View fehlen |
| 4. Chat mit Realtime | 🟢 | Funktional, Chat-Liste ist Stub |
| 5. PWA + Polish | 🟡 | Manifest + Icons da, restliche Polish fehlt |
| 6. Closed Beta | ⬜ | — |

Legende: ✅ fertig · 🟢 vorhanden, braucht Feinschliff · 🟡 angefangen, fehlt vieles · ⬜ nicht begonnen

---

## Hinweise zum Stack (Lessons aus bar-happenings)

- **Komponenten klein halten** (< 300 Zeilen). Wenn `SessionCreate.tsx` größer wird: zerlegen in `GymPicker`, `LevelPicker`, `WhenPicker`.
- **Queries pro Domain** in `src/queries/*.ts`. Keine `supabaseQueries.ts`-Megadatei.
- **Route-Lazy-Loading** ist von Tag 1 an drin. Nicht entfernen.
- **TanStack-Query staleTime: 5min** als Default. Override pro Query nur wenn nötig.
- **RLS strikt** — jede neue Tabelle braucht eine Policy, sonst ist sie für Clients unsichtbar oder offen. Niemals RLS deaktivieren in Production.

---

## Bekannte To-Dos im Skeleton

Stellen, an denen ich Annahmen getroffen habe, die du checken solltest:

1. **`useAuth.ts`** ist eine Neuschreibe der bar-happenings-Variante (ich konnte das Original nicht lesen). Wenn deins anders aussieht — vergleich es, übernimm Edge-Cases.
2. **Level-Modell** im Schema ist `text` (freie Eingabe, z. B. "6a–6c"). Das Konzept lässt offen, ob Enum oder Range. Wenn du dich entscheidest, später per Migration tighten.
3. **`sessions.creator_id`** referenziert `profiles(id)`, nicht `auth.users(id)`. Bewusst — sonst kannst du Profile nicht ohne Cascade-Pain joinen. Trigger `handle_new_user` füllt das automatisch.
4. **Match-Akzeptanz erzeugt Chat** via Trigger `handle_match_accepted`. Solide für 1:1, muss bei Gruppen-Sessions (Phase 2) überarbeitet werden.
5. **Realtime nutzt keinen Auth-Filter** — die RLS-Policies tun's. Bei Performance-Problemen später Realtime-Auth-Filter dazu.

---

*Skeleton-Version 0.1 · 27. Mai 2026 · viel Spaß beim Klettern 🧗*
