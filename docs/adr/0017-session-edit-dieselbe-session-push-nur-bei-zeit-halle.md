---
status: accepted
date: 2026-08-07
---

# Session-Edit: dieselbe Session bleibt bestehen, Push nur bei Zeit/Halle

## Kontext & Entscheidung

Bisher konnte eine Host:in ihre Session nur **löschen** — wer die Startzeit oder
Halle ändern wollte, musste die Session wegwerfen und neu anlegen, womit Chat,
angenommene Mitglieder und Anfragen verloren gingen. Die RLS-Policy
`session update own` (Migration 0002) erlaubt der Host:in das UPDATE zwar längst,
es gab nur keinen Client-Pfad dafür.

**Entscheidung:** Überall, wo „Delete session" angeboten wird (Feed-Aktions-Sheet,
Session-Detail, Chats-Swipe — [ADR-0013](0013-feed-tap-oeffnet-aktions-sheet-statt-detailseite.md),
[ADR-0015](0015-leave-chat-statt-session-loeschen-nach-feed-ablauf.md)), gibt es
daneben „Edit session". Editierbar sind alle vier Create-Felder (Halle, Zeitpunkt,
Spots, Notiz), im selben Zeitfenster wie Delete (nicht nach Feed-Ablauf). Die
Session bleibt dabei **dieselbe** Session: Mitglieder, Anfragen und Chat wandern
mit — auch über einen Hallen- und damit Stadtwechsel hinweg.

Die Eckpunkte, über die man ohne Kontext stolpert:

- **Kapazitäts-Untergrenze = besetzte Plätze.** Angenommene Anfragen sind
  verbindlich (Glossar) — Schrumpfen unter die Belegung würde stillschweigend
  Leute rauswerfen und ist deshalb nicht möglich. Schrumpfen auf „genau voll"
  verhält sich wie das Füllen des letzten Platzes (Status `matched`, offene
  Anfragen auto-declined, vgl. Migration 0014).
- **Vergrößern einer vollen Session öffnet sie wieder — ohne Revival.** Status
  geht `matched` → `open`, die Session ist im Feed wieder anfragbar. Die beim
  Vollwerden auto-abgelehnten Anfragen bleiben abgelehnt; wer noch will, fragt
  neu an. Die DB unterscheidet Auto-Ablehnung nicht von Host-Ablehnung — ein
  Revival würde ein neues Unterscheidungsfeld erfordern und im Zweifel Leute
  wiederbeleben, die die Host:in bewusst abgelehnt hat.
- **Push nur bei Zeit- oder Hallen-Änderung, nur an angenommene Mitglieder.**
  Ein Trigger auf `sessions`-UPDATE feuert `send-push` nur, wenn sich `starts_at`
  oder `gym_id` ändert („wann, wo" — die logistisch relevanten Änderungen);
  Notiz-/Spots-Änderungen pushen nicht (Push-Spam). Empfänger sind die
  Chat-Mitglieder außer der Host:in, Deep-Link in den Chat. Pending Requester
  bekommen bewusst **keinen** Push (v1-Entscheidung: ein Empfängerkreis, ein
  Deep-Link; sie sehen den neuen Stand bei Annahme oder auf der Detailseite).
- **System-Zeile im Chat** bei Zeit-/Hallen-Änderung („Session moved to …") —
  dauerhaft dokumentiert für alle ohne Push; kein Doppel-Push, weil der
  Nachrichten-Trigger nur bei `kind='text'` feuert.
- **ADR-0013 wird aufgeweicht:** Das Feed-Aktions-Sheet zeigt für die eigene
  Session jetzt **zwei** Handlungen (Edit + Delete) statt „genau einer". Für
  fremde Sessions bleibt es bei der einen Rollen-Aktion.

## Betrachtete Alternativen (und warum verworfen)

- **A — Nur Zeit + Notiz editierbar.** Verworfen: Hosts würden Spots-/Hallen-
  Änderung vermissen; die Grenzfälle (Kapazitäts-Floor, Wieder-Öffnen) sind mit
  den obigen Regeln beherrschbar.
- **B — Anfragen-Revival beim Wieder-Öffnen.** Verworfen: braucht ein neues
  Feld zur Unterscheidung Auto-/Host-Ablehnung und riskiert, bewusst Abgelehnte
  wiederzubeleben. Neu anfragen ist billig (Upsert belebt `cancelled` ohnehin
  wieder).
- **C — Push an alle Betroffenen inkl. pending Requester.** Verworfen für v1:
  zweiter Empfängerkreis mit eigenem Deep-Link (Detailseite statt Chat) für
  einen Randfall.
- **D — Push bei jeder Änderung.** Verworfen: eine Notiz-Korrektur würde die
  ganze Runde anpingen; Zeit/Halle sind die einzigen Änderungen, die eine
  Verabredung real verschieben.
