---
status: accepted
date: 2026-08-12
---

# Feed-Streifen live statt Focus-Refetch

## Kontext & Entscheidung

Die Rollen-Streifen der Feed-Karte (ADR-0006/0010) waren bewusst ohne Realtime:
`useMyPendingRequests`/`useMyAcceptedRequests`/`useMyDeclinedRequests` als
Set-Queries mit `staleTime 30s` + Focus-Refetch. Die 0006-Annahme dahinter —
„angenommen → Karte fällt ohnehin aus dem Feed" — gilt seit den Gruppen-Sessions
(ADR-0007) nicht mehr, und inzwischen ist der **Kader der Karte faktisch live**:
Die System-Zeilen-Invalidierung (`useMyChats`, ADR-0018) refetcht bei jedem
Join den Feed aktiv, der Avatar der:des Aufgenommenen erscheint sofort. Ergebnis
war ein sichtbarer Widerspruch auf derselben Karte: Avatar frisch drin,
Streifen daneben noch „Requested" — bis zum nächsten Tab-Wechsel. Declines
hatten gar keinen Live-Pfad (keine System-Zeile, kein Chat).

**Entscheidung: Die Feed-Streifen ziehen mit dem Kader gleich — live, aber ohne
ein einziges neues Realtime-Abo.**

- **Joined liest die Zeile selbst.** Neues Domain-Prädikat `hasClimber`
  (`domain/session.ts`, getestet): bin ich im eingebetteten `climbers`-Kader?
  Dieselbe Quelle wie die Avatare — Streifen und Kader **können** nicht mehr
  auseinanderlaufen, egal über welchen Pfad die Zeile frisch wurde.
  `useMyAcceptedRequests` (0010) entfällt ersatzlos, ebenso sein
  Focus-Refetch im Feed.
- **Requested/Declined über das bestehende Abo.** `useMyParticipations`
  (Chats-Tab-Badge, app-weit gemountet) hört bereits auf Antworten auf meine
  `match_requests`; sein Callback invalidiert jetzt zusätzlich
  `MY_PENDING_KEY`/`MY_DECLINED_KEY` — „Requested" verschwindet bzw. die
  abgelehnte Karte fällt im selben Moment, in dem der Chats-Tab wandert.
- **Bewusst NICHT den ganzen `["matches","outgoing"]`-Prefix invalidieren:**
  darunter liegt auch `MY_REQUEST_KEY` („Request sent" auf dem Session-Detail),
  und das Detail bleibt Snapshot (ADR-0018). Nur die zwei Feed-Set-Subtrees.

## Betrachtete Alternativen (und warum verworfen)

- **Eigenes Realtime-Abo für die Streifen** (0010 lehnte es ab — zu Recht):
  weiterhin unnötig, das Participations-Abo trägt dieselben Events schon.
- **Auch `pending` von der Zeile ableiten:** geht nicht — der Kader-Embed ist
  auf `accepted` gefiltert (RLS 0018 gibt nur den zu), pending-Zeilen sieht nur
  die:der Anfragende selbst. `useMyPendingRequests` bleibt darum als Set.
- **Alles beim Focus-Refetch belassen:** verwirft den Status quo nicht wegen
  Latenz an sich, sondern wegen der Halb-Frische — die Karte aktualisierte
  bereits live, nur eben unvollständig.
