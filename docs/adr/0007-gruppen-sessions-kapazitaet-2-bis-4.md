---
status: accepted
date: 2026-07-24
---

# Gruppen-Sessions: Kapazität 2 bis 4

## Kontext & Entscheidung

Eine Session war bis hierher **1:1 by construction**. Zwar trug das Schema seit
`0001` ein `max_buddies int (1..8)` und der Detail-Screen zeigte „Looking for N
buddies" — aber **nichts setzte das Feld** (Default 1), und der Trigger
`handle_match_accepted` ignorierte es: die **erste** angenommene Anfrage erzeugte
einen frischen 2-Personen-Chat und kippte die Session sofort auf `matched`
(„first accept wins"), womit sie aus dem Feed fiel. Eine Gruppe konnte so nie
entstehen.

Gewünscht: Die Ersteller:in soll eine Session für **bis zu 4 Leute** anlegen
können, sich selbst eingeschlossen. Das ist keine neue Spalte, sondern ein Umbau
der Kette **Annahme → Chat → Status**.

**Entscheidung:**

- **Kapazität statt Buddies.** Kanonische Einheit ist die **Party-Größe inkl.
  Ersteller:in**, 2–4 (siehe `CONTEXT.md` → Kapazität). Migration: neue Spalte
  `capacity int check between 2 and 4`, Backfill `capacity = least(max_buddies+1, 4)`,
  danach `max_buddies` **droppen**. Damit spricht das Schema die Domänensprache;
  der ewige Off-by-one („4 Leute = 3 Buddies") entfällt.
- **Die Ersteller:in wählt die Größe beim Anlegen** (2/3/4). Kein System-Fixum —
  eine gemütliche Zweier-Verabredung bleibt möglich. Untergrenze 2 (eine Solo-
  Session ergibt keinen Sinn).
- **Ersteller-Freigabe pro Person, nicht Open-Join.** Der bestehende
  `match_requests`-Fluss bleibt: anfragen → annehmen/ablehnen. **Jede Annahme
  besetzt einen Platz**, bis die Kapazität erreicht ist. Bewahrt die Kontrolle
  der Ersteller:in darüber, wer dabei ist, und die vorhandene Maschinerie.
- **Bleibt im Feed, bis voll.** Solange Plätze frei sind, bleibt `status = 'open'`
  und die Session nimmt Anfragen. Erst der **letzte** Platz kippt sie auf
  `matched` — hier **wiederverwendet als „voll"** (kein neuer Enum-Wert). Der
  Feed filtert weiter auf `status = 'open'`, volle Sessions fallen also von selbst
  heraus. Die Karte zeigt die **verbleibenden Plätze** („2 Plätze frei"), was im
  Feed-Query ein Mitzählen der angenommenen Anfragen verlangt.
- **Ein Session-Chat, wachsend.** Statt „pro Annahme ein neuer 2er-Chat" gibt es
  **einen** Chat je Session. Der Trigger `handle_match_accepted` wird umgebaut:
  existiert noch kein Chat für die Session, wird er erzeugt und die **Ersteller:in
  + die Anfragende** aufgenommen; existiert er, kommt **nur die Anfragende** dazu.
  Erreicht die Zahl der angenommenen Anfragen `capacity - 1`, wird die Session auf
  `matched` gesetzt **und alle noch offenen (pending) Anfragen automatisch
  abgelehnt** — kein Zombie-Zustand.
- **Chat öffnet beim ersten Accept, nicht erst bei „voll".** Ersteller:in und die
  frühen Beitretenden können sofort koordinieren, während sich die Session weiter
  füllt. Tritt später jemand bei, wird eine **System-Nachricht** in den Chat
  gelegt („Ben joined") — so sehen die Frühen die Gruppe wachsen. Das verlangt
  eine System-/Meta-Nachricht ohne menschliche Absender:in (die Blasen bilden
  Absender heute über `memberById` ab, also braucht der Rendering-Pfad einen Fall
  für „ist Systemzeile"). Umgesetzt im selben `handle_match_accepted`-Trigger, der
  das Mitglied aufnimmt.
- **Chat bleibt personen-zentriert.** Eine Zweier-Session zeigt in Liste und Kopf
  weiter die eine Gegenperson (unverändert). Eine Gruppe zeigt die Mitglieder
  („Anna, Ben +1") mit gestapelten Avataren. Die Nachrichten-Blasen tragen ihre
  Absender:in bereits per `memberById` — der Gesprächsteil ist schon gruppenfähig;
  nur **Chat-Listen-Zeile** und **Chat-Kopf** (heute `other?.display_name`) müssen
  den Mehr-Personen-Fall abbilden. `counterpartDeleted` (0 andere Mitglieder)
  bleibt gültig.
- **Kein Austreten in v1.** `pending` lässt sich zurückziehen (wie heute, ADR-0006);
  eine **angenommene** Teilnahme ist verbindlich. Kein Platz-Wiederaufmachen, kein
  Kick — das erspart Status-Rückflip (`matched → open`), Chat-Entfernung und
  Feed-Wiedereintritt. Ein Aussteiger wird sozial im Chat geklärt.

## Betrachtete Alternativen (und warum verworfen)

- **Fixe „immer bis zu 4"** ohne Größenwahl — verworfen: nimmt der Ersteller:in
  die Zweier-Verabredung. Die Wahl ist ein einzelner Picker, billig.
- **`max_buddies` behalten (1..3)** und in Code/UI zu `capacity` übersetzen —
  verworfen: spart die Migration, zementiert aber den Off-by-one als dauerhafte
  Naht zwischen Schema („buddies") und App/Glossar („capacity").
- **Open-Join (erste kommen, sofort drin)** — verworfen: schneller, aber nimmt der
  Ersteller:in den Freigabe-Gate und entwertet den bestehenden `Anfrage`-Begriff.
- **Leaves on first accept (Status quo)** — verworfen: unvereinbar mit dem Ziel;
  eine Vierergruppe könnte sich nie über Entdeckung füllen.
- **Getrennte 1:1-Chats statt Gruppen-Chat** — verworfen: verhindert
  Gruppen-Koordination („bis später alle!") an einem Ort.
- **Chat erst bei „voll" öffnen** — verworfen: frühe Beitretende säßen ohne
  Gesprächsmöglichkeit fest, und füllt sich die Session nie ganz (3/4, dann wird
  geklettert), öffnet der Chat nie. Open-on-first-accept + „Ben joined"-System-
  zeile gibt das Wachstum sichtbar wieder, ohne jemanden warten zu lassen.
- **Gruppen-Chat nach Session benannt** („Boulderklub · Fr 18:00") — verworfen:
  macht 1:1- und Gruppen-Chats inkonsistent (oder zwingt zum Umbenennen auch der
  1:1-Chats). Personen-zentriert ist der kleinere Eingriff und bleibt beim
  Mentalmodell „mit wem rede ich".
- **Offene Anfragen bei „voll" einfach liegen lassen** — verworfen: hinterlässt
  Anfragen, die nie erfolgreich sein können; die Anfragende hängt.
- **Austreten/Kick in v1** — verworfen fürs Erste: Platz-Wiederaufmachen bringt
  Status-Rückflip, Chat-Mitglieder-Entfernung und „voll → offen"-Feed-Handling —
  eigener Zuschnitt, nicht Teil der Gruppen-Bildung.
