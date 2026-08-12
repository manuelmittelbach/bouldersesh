---
status: accepted
date: 2026-07-24
---

# Eigenen Anfrage-Status an der Session zeigen

> **Update (ADR-0018, 2026-08-07):** Der Punkt „Realtime lässt ‚Request sent'
> live zu ‚Open chat' umschlagen" ist abgelöst — die Detailseite ist seither ein
> Snapshot beim Öffnen (`refetchOnMount: "always"`, kein Realtime-Abo mehr).
> Alle übrigen Entscheidungen gelten weiter.

> **Update (ADR-0019, 2026-08-12):** „Bewusst kein Realtime, nur Fetch-on-Focus"
> für den Feed-Streifen ist abgelöst — der Streifen aktualisiert jetzt live über
> das bestehende `useMyParticipations`-Abo (kein neuer Kanal). Die Sichtbarkeit
> an sich (Streifen an Feed-Karte + Detail) gilt unverändert.

## Kontext & Entscheidung

Wer eine Session anfragt („Climb together?" auf einer fremden Session,
`match_requests`), bekam bisher nur eine **flüchtige** Bestätigung („Request
sent"). Verlässt man den Screen und kommt zurück, gibt es **kein bleibendes
Zeichen**, dass man schon angefragt hat — der Button erscheint erneut, ein
zweiter Tap läuft in den `unique (session_id, requester_id)`-Fehler
(„Maybe you already asked?"). Der eigene Anfrage-Status soll deshalb **dauerhaft
an der Session** sichtbar sein.

Wichtig für den Zuschnitt: Das ist **rein Client-seitig**. Anfragende dürfen ihre
eigenen `match_requests` schon per RLS lesen (`0002_rls.sql`), und
`match_requests` liegt bereits in der Realtime-Publication (`0004`). **Keine
Migration nötig.**

**Entscheidung:**

- **Sichtbar an zwei Orten:** Session-**Detail** und **Feed-Karte**.
- **Zustände:** `pending` und `accepted` sind bedeutungstragend, `declined` /
  `cancelled` bleiben minimal.
  - `pending` → nicht-interaktive Anzeige „Request sent".
  - `accepted` → „Open chat", das per `session_id` den (vom
    `handle_match_accepted`-Trigger erzeugten) Chat auflöst und dorthin
    verlinkt.
  - `declined` → dezenter „Not this time"-Hinweis, kein Button.
  - noch keine Anfrage → der bestehende „Climb together?"-Button, unverändert.
- **Zurückziehen ist möglich und umkehrbar.** Motivation: Man fragt mehrere
  Sessions an und wird nur bei einer angenommen — von den übrigen muss man
  zurücktreten können. „Withdraw" (mit kurzer Bestätigung) setzt die eigene
  `pending`-Anfrage auf `cancelled`; wegen `unique (session_id, requester_id)`
  bleibt die Zeile bestehen. Ein erneutes Anfragen belebt sie per **Upsert**
  (`onConflict`) wieder auf `pending` — daher wechselt `useCreateMatchRequest`
  von Insert auf Upsert. Zurückgezogene Anfragen **verschwinden aus der
  Ersteller-Liste** (`getRequestsForSession` filtert `cancelled` weg), sonst
  stünden sie dort fälschlich als „Declined". Kein DB-Change: die UPDATE-RLS
  (`0002`) prüft nur `requester_id = auth.uid()`, nicht den Statuswert.
- **Detail-Screen:** Der bestehende Action-Bar-Platz unten **wechselt seinen
  Inhalt je nach Zustand** (statt eines zusätzlichen Banners weiter oben). Ein
  Realtime-Abo (gespiegelt vom bestehenden `session-requests:${sessionId}`) lässt
  „Request sent" **live** zu „Open chat" umschlagen, wenn währenddessen
  angenommen wird — der Detail-Screen filtert `matched`-Sessions nicht weg, also
  ist der Wechsel dort tatsächlich sichtbar.
- **Feed-Karte:** ein **ruhiger, volle-Breite-Streifen unter der Karte**
  („✓ Requested"), dezent getönt und klein. Er ist ein Erinnerungs-, kein
  Alarm-Signal, und gehört durch die Position eindeutig zu **dieser** Karte.
  Realtime ist hier bewusst **weggelassen** und nur Fetch-on-Focus: Der Feed
  zeigt nur `status = 'open'`; eine angenommene Anfrage kippt die Session auf
  `matched`, sie **fällt also ohnehin aus dem Feed**. Der einzige je im Feed
  sichtbare Zustand ist damit `pending` — der Streifen braucht keine
  Zustands-Logik.

## Betrachtete Alternativen (und warum verworfen)

- **Nur der flüchtige „Request sent"-Toast (Status quo)** — verworfen: sagt beim
  Wiederkommen nichts und lockt in den Unique-Constraint-Fehler.
- **Nur Detail-Screen, kein Feed** — verworfen: der Feed ist der Ort, an dem man
  Sessions überfliegt; ohne Feed-Hinweis fragt man versehentlich dieselbe Session
  erneut an. Der Feed-Streifen ist billig (eine einzige, nach `requester_id`
  gefilterte Abfrage für die ganze Liste).
- **Realtime überall (auch Feed)** — verworfen: technisch billig (ein einziges
  nach `requester_id` gefiltertes Abo), aber ohne Nutzen. `pending` setzt der
  eigene Tap (lokale Invalidierung reicht), und `accepted` lässt die Karte aus
  dem Open-Feed fallen — Realtime würde einen Zustand animieren, der entweder
  selbst-ausgelöst oder im-Verschwinden ist.
- **Zurückziehen als terminaler „Withdrawn"-Zustand** (kein Neu-Anfragen) —
  verworfen: einfacher im Datenpfad, aber eine Sackgasse, wenn man es sich anders
  überlegt. Da der Upsert den Re-Insert gegen den Unique-Constraint ohnehin löst,
  ist das voll umkehrbare Zurückziehen kaum teurer und deutlich natürlicher.
- **Ganze Feed-Karte abdunkeln statt Pill/Streifen** — verworfen: eine gedimmte
  Karte ist Stimmung, keine Aussage. Ein beschrifteter Streifen sagt explizit
  „Requested".
- **Streifen/Pill *über* der Karte oder in einer Ecke** — verworfen: der eigene
  Anfrage-Status ist **Sekundär-Info**. „Über" stellt ihn vor Ersteller:in/Zeit
  und dreht die Lese-Priorität um; die Ecke ist weniger eindeutig „gehört zu
  dieser Session" als ein Streifen unten in Lese-Reihenfolge.
