---
status: accepted
date: 2026-07-30
---

# Gruppenchat 24h nach Session-Start automatisch löschen

## Kontext & Entscheidung

Jede Session trägt ab ihrer Erstellung einen Gruppenchat
([ADR-0008](0008-chat-ab-session-erstellung-anfragen-nur-im-chat.md)); der Chats-Tab
listet sie als einheitliche Session-Zeilen
([ADR-0012](0012-einheitliche-session-zeilen-im-chats-tab.md)). Bislang lebten diese
Chats samt Nachrichten **unbegrenzt** in der DB — und die session-getriebenen Listen
(`getMySessions` / `getMyParticipations`) filterten `starts_at >= now`, ließen die
Zeile also **im Moment des Session-Starts** aus dem Tab fallen.

Beides passt nicht zum Zweck des Chats: Er soll das **kurzfristige Absprechen rund um
die Verabredung** tragen — „bin gleich da", „welcher Sektor" —, nicht ein dauerhaftes
Verlaufsarchiv sein. Ein Chat, der genau dann verschwindet, wenn man losklettert
(Start = 0h), ist zu früh weg; einer, der ewig bleibt, sammelt tote Runden und private
Nachrichten ohne Ablauf.

**Entscheidung:** Der Gruppenchat bleibt bis **24h nach `sessions.starts_at`**
erreichbar und wird dann **hart gelöscht**. Das Fenster deckt das Bouldern selbst und
den Nachlauf am selben Abend ab; danach ist die Runde vorbei und der Chat weg.

Umgesetzt in zwei aufeinander abgestimmten Hälften an **derselben 24h-Grenze**:

| Seite | Was | Wo |
| --- | --- | --- |
| Client (Sichtbarkeit) | Chat-Zeilen bleiben sichtbar/tippbar bis `starts_at + 24h` | `getMySessions` / `getMyParticipations` filtern `starts_at >= now − 24h` statt `>= now` (`CHAT_RETENTION_MS`) |
| DB (Löschung) | `chats`-Zeile wird gelöscht, sobald `starts_at + 24h < now()` | pg_cron-Job `expire-chats-24h`, stündlich (Migration 0019) |

Gelöscht wird **nur der Chat**, nicht die Session. Der Chat cascaded weiter auf
`chat_members` und `messages` (FKs seit 0001). Die **Session-Zeile bleibt** als
Vergangenheits-Datensatz stehen — wie jede andere abgelaufene Session auch — und der
`handle_session_created`-Trigger (Migration 0017) feuert nur `AFTER INSERT`, legt also keinen
Chat neu an. Client-Grenze und DB-Prädikat teilen bewusst dieselbe 24h-Schwelle: die
Zeile verschwindet aus dem Tab in genau dem Moment, in dem der Job ihre Daten wegräumt
— UI und DB bleiben konsistent.

Der Job läuft **stündlich** (`0 * * * *`): die Löschung greift innerhalb von ≤1h nach
dem 24h-Punkt — genau genug, ohne die DB minütlich zu scannen. pg_cron ist auf allen
Supabase-Plänen verfügbar; `cron.schedule` ist über den Job-Namen idempotent (re-run
ersetzt statt dupliziert). Pausieren später per `select cron.unschedule('expire-chats-24h')`.

**Zuschnitt:** eine Migration (0019, aktiviert `pg_cron` + legt den Job an) plus eine
read-side Filter-Änderung im Client. Die Grenze lebt in der `queryFn` (nicht im
Query-Key) → stabiler Key, kein Refetch-Sturm; Aktualisierung per Focus-Refetch.

## Betrachtete Alternativen (und warum verworfen)

- **A — Chat nur ausblenden, Daten behalten.** Verworfen: Der Nutzer wollte echtes
  Löschen; ein reines UI-Ausblenden lässt Nachrichten und tote Runden unbegrenzt in
  der DB liegen.
- **B — Ganze Session nach 24h löschen (cascaded auf den Chat, Migration 0015).**
  Verworfen: greift zu weit. Nur der Chat soll vergehen; die Session-Zeile schadet als
  stiller Vergangenheits-Datensatz nicht und wird ohnehin überall read-side
  weggefiltert.
- **C — Lazy-Delete beim Öffnen des Tabs (RPC statt Cron).** Verworfen: unzuverlässig
  — löscht nur, wenn jemand die App öffnet; abgelaufene Chats blieben bei inaktiven
  Nutzern beliebig lange liegen. pg_cron räumt garantiert und nutzerunabhängig auf.
- **D — Grenze bei Session-Start (0h) statt +24h.** Verworfen: schneidet den Chat
  genau dann ab, wenn man losklettert — kein Absprechen während/nach der Runde mehr.
- **E — pg_cron-Job + read-side Fenster an derselben 24h-Grenze (gewählt).** Echtes
  Löschen, garantiert und nutzerunabhängig; UI-Sichtbarkeit und DB-Ablauf fallen
  zusammen.
