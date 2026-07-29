---
status: accepted
date: 2026-07-29
---

# Einheitliche Session-Zeilen im Chats-Tab

## Kontext & Entscheidung

Der Chats-Tab gruppiert Sessions nach Rolle in drei Sektionen — „Hosting",
„Requested", „Joined" ([ADR-0010](0010-rollen-label-im-feed-hosting-joined-requested.md)
für dieselben drei Wörter im Feed). Die Zeilen zeigten aber je nach Zustand
**völlig verschiedene Dinge**: mal `Halle · Tag · Zeit` als Titel (Status-Zeilen),
mal den personen-zentrierten **Chat-Titel + Zeitstempel der letzten Nachricht**
(Konversations-Zeilen). Die Session-Zeit stand mal oben mit Tag, mal unten ohne
Tag, mal gar nicht. Zeile 2 war mal ein Status („No climbers yet"), mal die letzte
Nachricht, mal „with Max". Zwei getrennte Komponenten (`StatusRow`,
`ConversationRow`) trugen das, die Verzweigung hing an der Chat-Existenz.

Das wirkte zusammengewürfelt und machte die Sektionen untereinander
unvergleichbar.

**Entscheidung:** Alle Zeilen folgen **einer** session-zentrierten Struktur —
`linkes Glyph · Titel · Meta`, gerendert von **einer** Komponente (`SessionRow`,
generalisiert die alte `StatusRow`; `ConversationRow` entfällt):

- **Linkes Glyph** (56 px) je Rolle:
  - **Hosting → Krone-Kachel** (durchgängig, wie die leere Zeile und der Feed;
    Fortsetzung der „immer Krone bei Hosting"-Entscheidung — nie mehr die
    Mitglieder-Avatare).
  - **Joined → Avatar der Gastgeber:in** (das Gesicht, dem die Session gehört —
    konsistent mit dem Feed-Avatar).
  - **Requested → Uhr-Kachel** (neutraler Warte-Zustand; ein Gesicht wäre hier
    zu viel, man wartet ja erst auf Zusage).
- **Titel (Zeile 1):** immer `Halle · Tag · Zeit`
  (`formatSessionTime(withDay: true)`) — der Chats-Tab ist **nicht** auf einen
  Tag gefiltert (anders als der Feed), darum trägt jede Zeile den Tag selbst.
  Rechts der orange Aufmerksamkeits-Punkt bei **ungelesener Nachricht ODER
  offenen Anfragen** (unverändert; der Tab-Badge zählt genau diese Punkte).
- **Meta (Zeile 2):** letzte Chat-Nachricht, mit Status-Fallback:
  - **Requested →** `Waiting for reply` (kein Chat-Zugriff vor der Zusage).
  - **Hosting, leer** (`accepted_count === 0`) **→** `No climbers yet` (hat
    Vorrang vor „No messages yet" — „hier ist noch niemand" ist die wichtigere
    Info).
  - **Hosting, aktiv / Joined →** letzte Nachricht, sonst `No messages yet`.
  - Ungelesen → Text hervorgehoben (dunkel), sonst grau. Rechts die
    `N want to join`-Pill nur bei Hosting mit offenen Anfragen.

**Bewusst NICHT dabei:** kein Zeitstempel der letzten Nachricht (die Session-Zeit
im Titel ist der einzige Zeitanker) und kein Absender-Präfix vor der Nachricht
(`lastMessage` trägt nur `sender_id`, keinen Namen — die Auflösung inkl.
Sonderfälle „ich"/gelöschter Account wäre Aufwand ohne genug Gewinn; jederzeit
nachrüstbar).

**Sortierung** bleibt nach Termin (nächste Session oben), **Tippen** öffnet den
Chat (Requested → Session-Detail, mangels Chat) und **Wischen** (Löschen/
Verlassen/Zurückziehen) bleibt unverändert. Rein Client-seitig, keine Migration.

## Betrachtete Alternativen (und warum verworfen)

- **A — Status quo (zwei Zeilen-Typen).** Verworfen: genau das uneinheitliche
  Bild — Titel-Identität, Zeitformat und Zeile-2-Bedeutung kippten je nach
  Chat-Zustand.
- **B — Chat-zentrierter Titel** (Namen der Leute + letzte-Nachricht-Zeit, wie ein
  klassischer Messenger; Session als kleine dritte Zeile). Verworfen: kollidiert
  mit der Termin-Sortierung und der „immer Krone"-Rolle; die Session, nicht die
  Konversation, ist hier die primäre Einheit.
- **C — Reine Session-Info, nie eine Nachricht** (Zeile 2 immer Gastgeber/Status).
  Maximal uniform, aber in einem Tab namens „Chats" fühlt sich eine Zeile ohne
  jeden Chat-Bezug tot an — und aktive Hosting-Sessions hätten eine fast leere
  Zeile 2. Verworfen zugunsten der Nachricht-mit-Fallback-Regel.
