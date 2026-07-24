# Glossar

Gemeinsame Begriffe für Boulder Buddy. Ziel: **ein Konzept, ein Name** — Drift
zwischen Code, UI und Gesprächen hier auflösen.

## Anfrage (match request)

Der Vorgang „ich will bei deiner Session mitklettern". Dasselbe Konzept trägt im
Projekt mehrere Namen — alle meinen **dasselbe**:

- **`match_requests`** — die Tabelle / der kanonische Code-Name.
- **„Anfrage"** — der deutsche Begriff in Code-Kommentaren.
- **„Climb together?"** — das Button-Label in der UI, das eine Anfrage auslöst.
- **„boulder request" / „Request"** — umgangssprachlich / in User-Gesprächen.

Kanonisch im Code ist **match request / `match_requests`**. Eine Anfrage hat einen
`status`: `pending` → `accepted` | `declined` | `cancelled`. Pro
(Session, anfragende Person) gibt es **genau eine** Anfrage
(`unique (session_id, requester_id)`).

Wird eine Anfrage **angenommen**, erzeugt der Trigger `handle_match_accepted`
einen [Chat](#chat) und setzt die Session auf `matched` („first accept wins").

## Session

Eine Verabredung zum Bouldern: eine Person (`creator`) an einer `gym`
(Halle) zu einer Zeit, mit einer Pflicht-**Notiz** (`note`, „was ich klettern
will", siehe ADR-0005) und `max_buddies` gesuchten Mitkletternden. `status`:
`open` → `matched` | `done` | `cancelled`. Der Feed zeigt nur `open`.

## Chat

Wird erst bei **angenommener** Anfrage angelegt (nicht vorher). Verknüpft über
`session_id` und enthält Ersteller:in + angenommene anfragende Person als
`chat_members`.

## Stadt (city)

Eigene Entität; die aktive Stadt ist nur lokal, der Feed ist nach Stadt gescoped
(via `gym.city_id`). Siehe ADR-0002.
