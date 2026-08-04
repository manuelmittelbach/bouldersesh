---
status: accepted
date: 2026-07-22
---

# Kletter-Niveau: grobes Personen-Band + Freitext-Notiz statt Session-Grade

## Kontext & Entscheidung

Die App hatte zwei konkurrierende „Level"-Konzepte: ein grobes Band am Profil
(`profiles.skill_level`: beginner/intermediate/advanced/pro) und einen
strukturierten Fb-Grade an der Session (`sessions.level`, im Create-Screen als
Chips `5+ … 7b`, Label „Preferred level"). Beide setzen voraus, dass Leute ihren
Grad kennen. Das tun die **allermeisten Boulderer nicht** — sie denken in den
**Farb-Circuits ihrer Halle**, und „rot" bei der einen Halle ist nicht „rot" bei
der anderen. Ein universeller Grade ist damit für den wichtigsten Zweck der App —
sich zum Bouldern verabreden — der falsche mentale Rahmen.

Zwei Beobachtungen entscheiden die Sache:

1. Ein hallen-relativer Ausdruck („ein paar rote knacken") ist **nur neben einer
   konkreten Halle lesbar**. Eine Session hat eine Halle; ein Profil hat keine
   (die Stammhalle wurde entfernt). Der ehrliche, konkrete Ausdruck gehört also
   an die **Session**, nicht ans Profil.
2. Level ist hier ein **Kontext-Signal, kein Filter** — es wird nichts gematcht
   oder verglichen. Damit muss nichts strukturiert/vergleichbar sein; Freitext
   genügt.

**Entscheidung:**

- **`sessions.level` entfällt.** Was jemand klettern will, steht in der
  Session-**Notiz** (`sessions.note`). Der Create-Screen rahmt sie level-vorwärts
  („What are you climbing?", Beispiel „e.g. trying to crack some reds").
  **Nachtrag 2026-08-04 (Migration 0026):** Die Notiz ist wieder **optional**.
  Ursprünglich (0011) wurde sie zur Pflicht — begründet damit, dass „was ich
  klettern will" garantiert an der Session stehen soll. In der Praxis ist die
  Notiz aber ein **Kontext-Signal, kein Filter** (siehe Punkt 2 oben): Halle und
  Zeit genügen zum Verabreden, und der Zwang bremst genau die Leute, die nur
  schnell „los geht's" wollen — dieselbe Reibungs-Abwägung, die das Profil-Niveau
  optional hält. Die Notiz bleibt prominent angeboten (Hint „Optional, but it
  helps people decide."), aber freiwillig. `level` bleibt entfernt.
- **`profiles.skill_level` bleibt** — grob, gym-unabhängig, **optional**. Es ist
  das einzige Level-Signal, das ohne Grade-Wissen und ohne Hallen-Kontext
  funktioniert.
- Auf der **Session-Karte** zeigt das bestehende `GradePill` künftig das
  **Niveau der Ersteller:in** (Band-Label, gefärbt) statt eines Session-Grades.
  Hat die Person kein Niveau gesetzt, wird **kein Pill** gezeigt.

Migration 0011: `sessions.level` droppen, `sessions.note` auf `NOT NULL` +
Nicht-leer. Zum Zeitpunkt der Entscheidung existieren 2 Sessions, beide mit
Notiz — kein Backfill nötig. **Migration 0026** nimmt die note-Pflicht wieder
zurück (nullable, Constraint weg) — siehe Nachtrag oben.

## Betrachtete Alternativen (und warum verworfen)

- **Fb-Grade an der Session behalten (Status quo)** — verworfen: verlangt
  Grade-Wissen, das die Zielgruppe meist nicht hat, und ist über Hallen hinweg
  ohnehin nicht bedeutungsgleich.
- **Hallen-Farben strukturiert modellieren** (jede Halle mit eigenem
  Farb-Circuit, Session wählt aus den Farben *ihrer* Halle) — verworfen für
  jetzt: beste Scanbarkeit, aber verlangt pro Halle gepflegte, uneinheitliche
  Circuit-Daten. Zu schwer für eine junge App; die Notiz erreicht 90 % davon
  zum Nulltarif.
- **Niveau zur Pflicht im Profil machen** — verworfen: würde zwar jeder Karte ein
  Pill garantieren, erkauft das aber mit Reibung an einer Stelle, an der Leute
  nur „los geht's" wollen. Fehlt das Niveau, zeigen wir lieber kein Pill.
- **Niveau ganz vom Profil streichen** — verworfen: das grobe Band ist der eine
  Level-Ausdruck, der gym-unabhängig trägt, und liefert das Karten-Pill.
