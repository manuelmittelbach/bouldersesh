# Was ich für BoulderSesh anders machen würde — Lessons aus `bar-happenings-berlin`

Nach dem Blick ins bestehende Projekt: das ist ein reifer, gut strukturierter Stack. Vieles davon würde ich 1:1 übernehmen — und genau **deswegen** revidiere ich ein paar Empfehlungen aus dem ersten Konzept.

---

## 1. Stack-Korrektur: Vite + React, NICHT Next.js

**Mein erster Vorschlag war Next.js.** Nach dem Bar-Happenings-Code revidiere ich das:

- Du hast in dem Projekt bereits **Vite + React + TypeScript + Tailwind + shadcn/ui + Supabase + TanStack Query + React Hook Form + Zod + React Router DOM** produktionsreif zum Laufen gebracht.
- Genau dieser Stack reicht für BoulderSesh auch. BoulderSesh braucht **kein Server-Rendering** (anders als ein SEO-getriebener Event-Guide; bei einer Match-App ist alles hinter Login). Damit fällt der Hauptvorteil von Next.js weg.
- Vite ist schneller im Dev-Modus, kleineres Mental Model, und du kennst es.

→ **BoulderSesh: gleicher Stack wie bar-happenings.** Du sparst dir Tage Lernkurve.

**Eine Sache, die du dann mitnehmen musst, die Next.js dir geschenkt hätte:** Code-Splitting. Bei Bar-Happenings sehe ich ein Symptom davon:

```
// vite.config.ts
maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
// Comment: "Main JS chunk currently exceeds Workbox's 2 MiB default."
```

Das heißt: ein einzelnes JS-Bundle ist über 2 MB groß. Ursache: alle Routen werden in einem Bundle ausgeliefert. Bei BoulderSesh würde ich von Anfang an **Route-basiertes Lazy Loading** machen:

```tsx
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
// Suspense + Route in App.tsx
```

Damit lädt der User beim ersten Aufruf nur die Dashboard-Route, und Chat/Profile kommen erst beim Navigieren.

---

## 2. Was ich aus bar-happenings 1:1 übernehmen würde

Diese Patterns sind dort sauber gelöst — wäre Verschwendung, sie neu zu erfinden:

- **`useAuth.ts` Hook** — mit `onAuthStateChange`, Rolle aus Profile-Tabelle ziehen, in TanStack Query cachen. Kann ich für BoulderSesh fast 1:1 kopieren (nur ohne die organizer/admin-Rollen).
- **AuthCallbackGate** — der Mechanismus, der den Auth-Callback (Magic Link, OAuth) erkennt und nach Login auf die richtige Seite redirectet, statt User auf der Auth-Seite hängen zu lassen.
- **shadcn/ui Komponenten-Auswahl** — Dialog, Select, Toast, Tooltip, Form mit Zod-Resolver. Direkt übernehmen.
- **PWA-Setup mit `vite-plugin-pwa`** — exakt wie dort, inkl. Manifest, Icons, Workbox.
- **TanStack Query mit `staleTime: 5 * 60 * 1000`** als Default — passt auch für BoulderSesh gut (Sessions ändern sich nicht im Sekundentakt).

---

## 3. Was ich anders machen würde

Drei Dinge sehe ich, die im BoulderSesh-Projekt von Anfang an besser laufen sollten:

### 3.1 Komponenten kleiner halten

`src/pages/Index.tsx` ist **780 Zeilen**. `src/components/events/EventForm.tsx` ist **566 Zeilen**. Das ist Code, in dem man sich verläuft, und der schwer zu testen ist.

Für BoulderSesh würde ich Konventionen früh festlegen:
- Eine Page-Komponente sollte hauptsächlich **layouten und State orchestrieren**, nicht Markup ausschreiben.
- Sub-Komponenten in `src/components/sessions/SessionCard.tsx`, `SessionFilterBar.tsx`, `SessionForm.tsx`, `SessionFormStepLevel.tsx` etc.
- Faustregel: Wenn eine Datei 300+ Zeilen hat, schauen ob man Sub-Komponenten oder Hooks rausziehen sollte.

### 3.2 Queries pro Domain trennen, nicht eine Mega-Datei

`src/lib/supabaseQueries.ts` in bar-happenings ist **1603 Zeilen**. Das wird mit der Zeit unwartbar — schwer zu finden, wo eine Query lebt, Test-Aufwand steigt.

Für BoulderSesh von Anfang an:

```
src/queries/
  profiles.ts        // ~150 Zeilen
  sessions.ts        // ~200 Zeilen
  matches.ts         // ~100 Zeilen
  chat.ts            // ~150 Zeilen (mit Realtime-Subscription)
  gyms.ts            // ~80 Zeilen
```

Jede Datei exportiert ein paar Funktionen wie `getOpenSessions()`, `createSession()`, ein paar Custom Hooks wie `useOpenSessions()`. Bleibt überschaubar, einzelne Files sind testbar.

### 3.3 Realtime-Chat — das ist das neue Stück

Bar-Happenings hat kein Echtzeit-Feature; BoulderSesh lebt davon. Das wird die Hauptkomplexität, die du dort *nicht* schon gelöst hast. Plan dafür:

- Supabase Realtime auf der `messages`-Tabelle abonnieren (`supabase.channel(...).on('postgres_changes', ...)`)
- TanStack-Query-Cache bei eingehender Message **invalidieren** oder **patchen** (Letzteres performanter)
- Subscription pro Chat anlegen, nicht global, und beim Unmount aufräumen
- Fallback: bei Reconnect alle Messages seit `last_read_at` neu laden

Das ist gut machbar, aber nicht trivial — etwa 1 zusätzliches Wochenende gegenüber meiner ursprünglichen Roadmap.

---

## 4. Spezifische Patterns, die ich kopieren würde

| Pattern in bar-happenings | Wo es bei BoulderSesh passt |
|---|---|
| `useEvents.ts` Hook | → `useOpenSessions.ts` (mit Filter-Params aus URL) |
| `EventCard.tsx` (236 Z.) | → `SessionCard.tsx` (Foto, Halle, Zeit, Level, CTA) |
| `MapView.tsx` mit MapLibre | → später: Karte mit Hallen-Standorten |
| `featureFlags.ts` | → super, gleich von Tag 1 für "Chat Beta" etc. |
| `recurrence.ts` (mit Tests) | → später: wiederkehrende Sessions |
| `useFilterParams.ts` | → Filter-State im URL persistieren (Halle, Datum, Level) |
| Supabase RLS-Policies | → für Sessions/Matches/Messages konsequent |

---

## 5. Aktualisierte Roadmap mit dem neuen Stack

| Phase | Zeit | Notiz |
|---|---|---|
| 0. Repo-Setup, Vite-Skeleton, Supabase-Anbindung | 1 Wochenende | Pattern aus bar-happenings übernehmen |
| 1. Auth + Profile + Halle-Picker | 1 Wochenende | `useAuth` Hook portieren |
| 2. Session-CRUD + Dashboard | 2 Wochenenden | `SessionCard`, Filter via `useFilterParams` |
| 3. Match-Anfragen | 1 Wochenende | RLS streng definieren, In-App-Notification |
| 4. **Chat (mit Realtime)** | **2 Wochenenden** | Neuer Stoff — extra Puffer |
| 5. PWA + Polish | 1 Wochenende | `vite-plugin-pwa` config aus bar-happenings |
| 6. Beta-Test mit Freunden | 2 – 4 Wochen real | Iterieren, nicht featuren |

→ Realistisch **7 – 9 Wochenenden** bis Beta. Etwas schneller als vorher, weil du den Stack schon kennst.

---

## 6. Kurzfassung als Bullet Points

- **Stack-Wechsel: Vite + React** statt Next.js — du kennst es schon, kein Server-Rendering nötig
- Von Tag 1: **Route-Lazy-Loading** einbauen (Bar-Happenings-Bundle ist >2MB → vermeidbar)
- **Komponenten klein** halten (<300 Zeilen Faustregel) — bei bar-happenings einige Files zu groß geworden
- **Queries pro Domain** in `src/queries/*.ts` splitten — nicht eine Mega-Datei
- **Realtime-Chat ist das neue Stück** — extra Wochenende einplanen
- `useAuth`, `EventCard`-Pattern, PWA-Config, shadcn/ui-Setup → kannst du fast 1:1 übernehmen

*Ergänzung zum Hauptkonzept, 10. Mai 2026.*
