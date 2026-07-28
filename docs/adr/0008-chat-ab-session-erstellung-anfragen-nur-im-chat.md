---
status: accepted
date: 2026-07-28
---

# Chat ab Session-Erstellung, Anfragen nur im Chat

## Kontext & Entscheidung

ADR-0007 ließ den Session-Chat **beim ersten Accept** entstehen; die offenen
Beitritts-Anfragen wurden auf der **Session-Detailseite** angenommen/abgelehnt. In
der Chats-Pipeline (siehe Memory `chats-pipeline`) springt eine eigene Session-Zeile
aber direkt in den Chat, sobald ein Chat existiert — und sobald die Session voll ist
(`status = 'matched'`), fällt sie aus dem Feed. Ergebnis: Nach dem ersten Accept war
die **Detailseite unerreichbar**, und mit ihr die einzige Stelle, an der man Anfragen
verwalten konnte. „My Sessions" (führt zur Detailseite, solange leer) und „Joined
Sessions" (führt in den Chat) verhielten sich zudem **inkongruent**.

**Entscheidung:**

- **Chat existiert ab Session-Erstellung, nicht erst beim ersten Accept.** Ein neuer
  `AFTER INSERT`-Trigger auf `sessions` (`handle_session_created`, `SECURITY DEFINER`)
  legt Chat + die Ersteller:in als alleiniges Mitglied an. `handle_match_accepted`
  wird entsprechend vereinfacht (der Chat ist immer schon da; ein winziger defensiver
  Fallback bleibt) und legt **auch bei der ersten Annahme** die „Ben joined"-System-
  zeile — die frühen Beitretenden sehen die Gruppe konsistent wachsen. Migration
  `0017` backfillt zukünftige eigene Sessions ohne Chat.
- **Anfragen leben allein im Chat.** Der angeheftete Anfragen-Block oben im Chat
  (Annehmen/Ablehnen direkt dort) ist die **einzige** Heimat; `IncomingRequests`
  verschwindet aus `sessions/[id].tsx`. Damit sind „My" und „Joined" kongruent —
  beide öffnen immer einen Chat.
- **Info-Knopf in jedem Chat-Kopf** → Session-Detailseite. Weil die Chats-Zeile nun
  direkt in den Chat springt, ist das der Weg zurück zur Detailseite — für Gastgeber:in
  wie Beigetretene.
- **Leere eigene Session behält die Status-Optik.** In der Chats-Liste bleibt eine
  Session ohne angenommene Mitglieder eine **Status-Zeile** (Hand-Kachel, „No climbers
  yet" / „N wollen mit"-Pill), tippt aber in den (leeren) Chat statt auf die
  Detailseite. Verzweigt wird über `accepted_count > 0`, nicht mehr über die
  Chat-Existenz — das routet zugleich den ADR-0004-Fall (Gegenüber gelöscht) korrekt
  in die Konversationszeile.
- **Solo-Chat-Kopf: „Halle · Zeit".** Solange die Ersteller:in allein ist, trägt der
  Kopf die Session-Kennung statt eines Namens, die Nachrichtenliste einen weichen
  Leerzustand; der Composer bleibt aktiv (Vorab-Notiz möglich). Sobald wer beitritt,
  übernimmt die personen-zentrierte Avatar-Namen-Leiste.

## Betrachtete Alternativen (und warum verworfen)

- **Chat erst beim ersten Accept (ADR-0007, Status quo)** — verworfen: macht die
  Detailseite nach dem ersten Accept unerreichbar und lässt „My"/„Joined" divergieren.
- **Anfragen auf der Detailseite lassen, nur Chat vorziehen** — verworfen: die
  Detailseite ist nach Accept/„voll" nicht mehr erreichbar, die Anfragen also nicht
  mehr verwaltbar. Ein Ort für Anfragen, und zwar der erreichbare (der Chat).
- **Leere eigene Session als Personen-Konversationszeile zeigen** — verworfen: „hier
  ist noch niemand" muss auf einen Blick lesbar bleiben; die Status-Optik (Icon-Kachel
  statt Personen-Avatar) trägt genau das.
- **„Halle · Zeit" generell als Chat-Titel** — bleibt verworfen (ADR-0007): der
  personen-zentrierte Titel ist der kleinere Eingriff, sobald ein Gegenüber da ist.
  Der Solo-Leerzustand hat aber **keine Person zum Zentrieren** — dort ist die
  Session-Kennung die einzige sinnvolle Verortung, ein eng begrenzter Sonderfall, den
  ADR-0007 nicht betrachtet hat.
