---
status: accepted
date: 2026-07-20
---

# Stadt wird eine eigene Entität (`cities`), nicht länger ein Freitext-Feld auf `gyms`

## Kontext & Entscheidung

Der Feed soll nach Stadt gefiltert werden, und beim Anlegen einer Session wählt
man erst die Stadt und dann eine Halle darin. Bisher war die Stadt eine
**nullable Freitext-Spalte** `gyms.city` (`supabase/migrations/0001_initial.sql:28`)
ohne Constraint, Index oder Normalisierung.

**Entscheidung:** Es entsteht eine Tabelle `cities (id uuid pk, name text unique)`.
`gyms` bekommt `city_id uuid not null references cities(id)`, die Werte werden aus
den vorhandenen Texten gebackfillt, und `gyms.city` wird **gedroppt**. Städte sind
kuratiert — RLS bleibt für alle read-only, wie heute für `gyms`
(`0002_rls.sql:11`). Der Feed filtert über einen Join auf `gyms.city_id`
(neuer Index `gyms(city_id)`), da `sessions` bewusst keine eigene Stadt-Spalte
bekommt: die Stadt einer Session ist immer die ihrer Halle.

## Betrachtete Alternativen (und warum verworfen)

- **`SELECT DISTINCT city FROM gyms`** — verworfen: jede Tippvariante („München",
  „Muenchen", „München ") wird zu einer eigenen Stadt, und Hallen mit `city = NULL`
  fallen in einer stadt-gegateten App komplett aus der Sichtbarkeit. Genau die
  Fehlerklasse, die eine Stadt-Auswahl unbrauchbar macht.
- **Feste Städte-Liste im App-Code** — verworfen: jede neue Stadt bräuchte ein
  App-Update und könnte von der DB abweichen.
- **`sessions.city_id` denormalisieren** — verworfen: zweite Wahrheit neben
  `gym.city_id`, die auseinanderlaufen kann. Der Join über `gyms` ist bei dieser
  Datenmenge unkritisch.

## Konsequenzen

- Nutzer:innen können **keine** Städte anlegen. „User dürfen Hallen anlegen"
  (Städte weiterhin kuratiert) ist bewusst ins Backlog geschoben — es braucht
  INSERT-RLS und eine Antwort auf Dubletten.
- `gyms.city` verschwindet aus den handgeschriebenen Typen
  (`mobile/src/types/database.ts`) und allen Stellen, die `name · city` rendern.
- `supabase/seed.sql` wird für Städte idempotent gemacht (`name` ist unique) —
  die heutigen `gen_random_uuid()`-Gym-IDs machen `on conflict do nothing` dort
  wirkungslos.
