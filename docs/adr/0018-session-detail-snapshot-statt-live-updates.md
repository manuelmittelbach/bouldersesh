---
status: accepted
date: 2026-08-07
---

# Session-Detail: Snapshot beim Öffnen statt Live-Updates

## Kontext & Entscheidung

Die Session-Detailseite (`sessions/[id]`) hatte drei Live-Quellen: die
System-Zeilen-Invalidierung (`useMyChats`) refetchte `SESSION_KEY` aktiv →
Zeit/Halle/Status sprangen um; `useSessionClimbers` hielt Kader und „Spots left"
per Realtime nach (ADR-0009); `useMyRequestForSession` ließ „Request sent" live
zu „accepted" umschlagen (ADR-0006). Ergebnis: Eine Seite, die sich unter den
Augen der Betrachter:in verändert — als irritierend empfunden („komisch, wenn
das live umspringt"), und ohnehin redundant informiert: Zeit-/Hallen-Änderungen
melden Push (ADR-0017), Annahmen melden Push und der Chats-Tab
(`useMyParticipations` behält Realtime).

**Entscheidung: Die Detailseite ist ein Snapshot beim Öffnen.**

- **Alle drei Detail-Hooks** (`useSession`, `useSessionClimbers`,
  `useMyRequestForSession`) laden per `refetchOnMount: "always"` bei **jedem
  Öffnen bedingungslos frisch** — der Cache kann jünger als die staleTime und
  trotzdem falsch sein (Host-Edit, von dem Pending-Requester weder System-Zeile
  noch Push erreicht). Danach steht die Seite, bis sie neu geöffnet oder die App
  aus dem Hintergrund geholt wird (Foreground-Refetch stale-gesteuert).
- **Die Realtime-Kanäle von `useSessionClimbers` und `useMyRequestForSession`
  entfallen** ersatzlos (weniger Socket-Traffic; die Frische liefert der
  Mount-Refetch). Eigene Mutationen (Request/Withdraw/Leave) aktualisieren die
  Seite weiterhin sofort über ihre Invalidierungen — eigene Aktion ist kein
  „Umspringen".
- **Die System-Zeilen-Invalidierung markiert `["sessions"]` nur noch stale**
  (`refetchType: "none"`) **und refetcht gezielt die Listen aktiv**: Feed
  (`["sessions","open"]`), „Your sessions" (`"mine"`), Teilnahme-Zeilen
  (`"participations"`) sowie die Chat-Mitglieder-Leiste. Listen dürfen live
  wandern — nur die geöffnete Detailseite nicht.
- **Der Kopf des offenen Chats bleibt live** (Drift-Fix 5c89842): Das
  Chat-eigene Abo (`useMessages`) invalidiert bei System-Zeilen `SESSION_KEY`
  der zugehörigen Session. Es lebt nur, solange der Chat offen ist — die
  Detailseite bleibt davon unberührt.

Damit sind die Realtime-Punkte aus ADR-0006 (Live-Umschlag des Anfrage-Status
auf dem Detail) und ADR-0009 (Realtime hält die Climbers-Liste live) **in diesem
Punkt abgelöst**; die übrigen Entscheidungen beider ADRs gelten weiter.

## Betrachtete Alternativen (und warum verworfen)

- **Status quo (Detail live)** — verworfen: Seiteninhalt, der sich unangekündigt
  unter den Augen verändert, wirkt fehlerhaft statt lebendig; der Informations-
  wert ist über Push/Chats-Tab bereits abgedeckt.
- **Nur Zeit/Halle einfrieren, Kader + Anfrage-Status live lassen** — verworfen:
  halbgar; dieselbe Seite wäre teils statisch, teils springend. Eine Regel
  („Snapshot beim Öffnen") ist erklärbar und konsistent.
- **Live-Update mit Hinweis-Banner („Session updated — tap to refresh")** —
  verworfen: mehr UI und ein zusätzlicher Zustand für einen seltenen Fall, den
  Push + frisches Öffnen bereits lösen.
- **Realtime-Kanäle behalten, aber nur stale markieren** — verworfen: ein
  offener Websocket-Kanal pro Detail-Besuch nur fürs Stale-Markieren ist
  Verschwendung, wenn `refetchOnMount: "always"` dieselbe Garantie ohne Socket
  gibt.
