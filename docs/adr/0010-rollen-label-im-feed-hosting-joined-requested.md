---
status: accepted
date: 2026-07-29
---

# Rollen-Label im Feed: Hosting / Joined / Requested

> **Update (ADR-0019, 2026-08-12):** Die Datenquelle des `Joined`-Streifens ist
> abgelöst — `useMyAcceptedRequests` entfällt, das Label liest den in der
> Feed-Zeile eingebetteten Kader (`hasClimber`, `domain/session.ts`); „kein
> Realtime" für Requested/Declined ist ebenfalls abgelöst (Invalidierung über
> das bestehende `useMyParticipations`-Abo). Rollenleiter, Optik und
> Chats-Tab-Angleich gelten unverändert.

## Kontext & Entscheidung

[ADR-0006](0006-eigenen-anfrage-status-an-der-session-zeigen.md) führte den
volle-Breite-Streifen unter der Feed-Karte ein — dort aber **bewusst nur für den
`pending`-Zustand** („✓ Requested"), mit der Begründung, `pending` sei der
einzige je im Feed sichtbare eigene Anfrage-Zustand, der Streifen brauche „keine
Zustands-Logik" (0006, „Feed-Karte").

Das greift zu kurz, sobald man **alle** meine Beziehungen zu einer Feed-Session
betrachtet — nicht nur die als Anfragende:r:

1. **Joined.** Seit den Gruppen-Sessions ([ADR-0007](0007-gruppen-sessions-kapazitaet-2-bis-4.md),
   Trigger `handle_match_accepted`/`0014`) kippt eine Session **erst mit dem
   letzten Platz** auf `matched`. Eine Kapazität-3/4-Session mit noch freiem Platz
   bleibt `open` und **steht weiter im Feed — auch für ihre schon aufgenommenen
   Mitglieder**. Für die ist der einzige Feed-Zustand also nicht mehr `pending`,
   sondern `accepted`. Die 0006-Annahme („angenommen → fällt aus dem Feed") gilt
   nur noch für Kapazität-2-Sessions.
2. **Hosting.** `getOpenSessions` schließt eigene Sessions nicht aus — **meine
   noch offene eigene Session steht im Feed**, war aber bisher ununterscheidbar von
   fremden. Als Ersteller:in fragt man sie nicht an, hat also nie einen 0006-Streifen.

**Entscheidung:** Der Feed-Streifen aus 0006 wird von einem `pending`-Sonderfall
zu einem **Rollen-Label mit drei Zuständen** verallgemeinert. Jede Feed-Karte
trägt **höchstens einen** Streifen — meine Rolle an dieser Session:

- **Hosting** (ich bin Ersteller:in) → brand-getönt, Crown-Icon. Hebt „deine
  Session" am stärksten hervor.
- **Joined** (accepted) → success-getönt (grün), Check-Icon. Bestätigt „du bist drin".
- **Requested** (pending) → bleibt rock-getönt (grau) wie in 0006, aber
  **Clock-Icon statt Check** — sonst teilten Joined und Requested dasselbe Symbol;
  „wartet = Uhr" ist ohnehin schon die App-Sprache (Chats-Tab, „Waiting for reply").

Die Zustände sind **gegenseitig ausschließend** und die Priorität ist zugleich
Ausschluss: Ersteller:in ≠ Anfragende:r, und eine Anfrage ist `accepted` **oder**
`pending`, nie beides. Reihenfolge der Prüfung: hosting → joined → requested.

**Zuschnitt wie 0006 beibehalten:** rein Client-seitig, **keine Migration**. Der
`Joined`-Streifen speist sich aus einem neuen `useMyAcceptedRequests` (Set von
`session_id`, gefiltert `requester_id = me AND status = 'accepted'`), das die
bestehenden `useMyPendingRequests`/`useMyDeclinedRequests` **exakt spiegelt** —
inkl. **kein Realtime**, `staleTime 30s`, Aktualisierung per Focus-Refetch. Das
`Hosting`-Label braucht **gar keine Abfrage**: `creator_id === auth.uid()` steht
schon in der Feed-Zeile.

**Einheitlichkeit mit dem Chats-Tab:** Der Chats-Tab gruppiert dieselben drei
Rollen bereits über **Sektions-Überschriften**. Damit beide Tabs eine Sprache
sprechen, wird die Überschrift „My Sessions" → **„Hosting Sessions"** angeglichen
(die anderen zwei heißen bereits „Requested/Joined Sessions"). Bewusst **keine**
zusätzlichen per-Zeile-Streifen in den Chat-Zeilen: unter einer „Joined
Sessions"-Überschrift wäre ein „Joined"-Streifen dieselbe Info doppelt.

## Betrachtete Alternativen (und warum verworfen)

- **Bei 0006 bleiben (nur `pending`)** — verworfen: lässt aufgenommene Mitglieder
  einer noch offenen Gruppen-Session sowie die eigene Session im Feed
  **ununterscheidbar** von fremden offenen Sessions. Genau die zwei Fälle, die die
  Gruppen-Sessions (0007) neu geschaffen haben.
- **Volle eigene/beigetretene Sessions zusätzlich in den Feed holen (statt nur
  labeln, was ohnehin da ist)** — verworfen: der Feed ist der **Entdecken**-Feed
  offener Sessions (CONTEXT.md). Meine vollen Sessions leben komplett im Chats-Tab;
  der Feed-Streifen ist nur der „du bist hier schon dabei"-Hinweis auf einer
  ohnehin sichtbaren, noch offenen Karte.
- **Eck-Badge/Pill statt Streifen** — verworfen aus denselben Gründen wie in 0006:
  die Rolle ist Sekundär-Info und gehört als Streifen **unten** in Lese-Reihenfolge,
  nicht in eine Ecke neben das Grade-Pill.
- **Realtime für den Joined-Streifen** — verworfen, konsequent zu 0006: Das
  Annehmen passiert auf dem Gerät der Ersteller:in; auf meinem Gerät genügt der
  Focus-Refetch beim Rückkehr in den Feed. Kein Nutzen, der ein Abo rechtfertigt.
- **Redundante Streifen auch in den Chats-Zeilen** — verworfen: doppelt mit der
  Sektions-Überschrift. Einheitlichkeit = **gemeinsames Vokabular**, nicht doppelte
  Deko.
