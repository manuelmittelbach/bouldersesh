---
status: accepted
date: 2026-07-31
---

# „Leave chat" statt Session löschen, sobald die Session vom Feed fällt

## Kontext & Entscheidung

Eine Session verschwindet aus dem Feed, sobald sie mehr als eine Stunde nach ihrem
Start liegt (`FEED_GRACE_MS = 1h`, `hasLeftFeed` in `src/lib/utils.ts`) — der Plan ist
dann gelaufen. Der Gruppenchat bleibt danach aber noch bis **24h nach `starts_at`**
erreichbar ([ADR-0014](0014-gruppenchat-24h-nach-session-start-loeschen.md)), damit die
Runde den Abend über weiterreden kann.

Bis zu diesem Feature bot die Session-Detail-Bottom-Bar in dieser Nachlauf-Phase
dieselbe destruktive Aktion wie vorher an: **„Delete session"** für die Host:in
(löscht die Session cascaded samt Chat) bzw. **„Leave session"** für Aufgenommene
([ADR-0012](0012-einheitliche-session-zeilen-im-chats-tab.md), `leave_session` aus
Migration 0016 — mit Platz-Neurechnung und `match_requests`-Rückabwicklung). Beides
ergibt hier keinen Sinn mehr: Es gibt nichts mehr abzusagen, der Plan ist vorbei. Wer
in dieser Phase auf „Delete" tippt, **reißt einer noch aktiven Runde den gemeinsamen
Chat weg** — obwohl er/sie eigentlich nur selbst gehen wollte.

**Entscheidung:** Ab dem Moment, in dem eine Session vom Feed gefallen ist
(`hasLeftFeed`), ersetzt an beiden UI-Stellen ein stilles **„Leave chat"** die
Delete-/Leave-session-Aktion. Man verlässt nur den eigenen Gruppenchat; Session,
`match_requests` und Plätze bleiben unangetastet, für die anderen bleibt alles stehen
(bis die 24h-Retention den Chat ohnehin wegräumt).

Umgesetzt über eine eigene RPC und ein gemeinsames Gate:

| Seite | Was | Wo |
| --- | --- | --- |
| DB | `leave_chat(p_session_id)` — entfernt nur die eigene `chat_members`-Zeile + „X left"-Systemnachricht; kein Session-Delete, keine Platz-Neurechnung, keine `match_requests` | Migration 0023, `SECURITY DEFINER`, `execute` nur `authenticated` (`anon`/`public` entzogen, Advisor-Lint 0028) |
| Client (Gate) | Sobald `hasLeftFeed(starts_at)` → Aktion wird „Leave chat" statt Delete/Leave session | Detail-Bottom-Bar (`sessions/[id].tsx`) **und** Chats-Tab-Swipe (`(tabs)/chats.tsx`), beide über denselben Helper |
| Client (Sichtbarkeit) | Nach dem Austritt verschwindet die Zeile sauber aus Hosting/Joined | Beide Sektionen sind an die Chat-Mitgliedschaft (`useMyChats`) gekoppelt — die entfernte `chat_members`-Zeile zieht sie raus, keine Geister-Zeile |

Anders als `leave_session` (0016) ist `leave_chat` **auch für die Host:in erlaubt** —
es gibt keinen Grund, jemanden im Chat einer längst gelaufenen Runde festzuhalten. Die
Funktion ist `SECURITY DEFINER`, weil ein Client unter RLS weder die eigene
`chat_members`-Zeile löschen noch eine System-Nachricht schreiben dürfte; sie prüft die
Mitgliedschaft selbst und beschriftet den Austritt symmetrisch zu „X joined"/„X left"
(0016/0017).

## Betrachtete Alternativen (und warum verworfen)

- **A — Delete/Leave session unverändert lassen.** Verworfen: In der Nachlauf-Phase ist
  „Delete" für die Host:in destruktiv gegenüber einer Runde, die den Chat evtl. noch
  nutzt — die häufige Absicht ist „ich will hier raus", nicht „den Chat für alle
  zerstören".
- **B — `leave_session` wiederverwenden statt eigener RPC.** Verworfen: `leave_session`
  rechnet Plätze neu und wickelt `match_requests` ab — nach Feed-Ablauf sinnlos — und
  verbietet der Host:in bewusst den Austritt. Der Chat-Austritt braucht genau das
  Gegenteil, deshalb eine schlanke eigene Funktion.
- **C — Chat nur clientseitig ausblenden, DB-Mitgliedschaft behalten.** Verworfen: Die
  „X left"-Ansage für die anderen und das echte Entfernen aus dem Kader (roster) wären
  nicht abbildbar; die Zeile käme über `useMyChats` beim nächsten Refetch zurück.
- **D — Ein eigener „My Sessions"-Tab für abgelaufene Runden.** Verworfen (siehe Memory
  `chats-pipeline`): Der Chats-Tab trägt Hosting/Requested/Joined ohnehin schon; ein
  zweiter Tab hätte die Rollen-Sicht zersplittert.
- **E — Eigene `leave_chat`-RPC + gemeinsames `hasLeftFeed`-Gate an beiden UI-Stellen
  (gewählt).** Ein Prädikat, eine Aktion, an Detail-Bar und Swipe identisch; die
  Mitgliedschafts-Kopplung an `useMyChats` hält UI und DB konsistent.
