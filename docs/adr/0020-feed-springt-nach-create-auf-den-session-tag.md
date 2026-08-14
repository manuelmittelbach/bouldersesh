---
status: accepted
date: 2026-08-14
---

# Feed springt nach dem Anlegen auf den Session-Tag

## Kontext & Entscheidung

Der Create-Flow kehrt per `router.replace("/")` in den Feed zurück — der stand
dann auf seinem alten Tag (meist Today, der Tag-State lebt nur als
Component-State im gemounteten Tab). Wer eine Session für Samstag anlegte,
landete auf einem Feed, in dem sie unsichtbar war: die Bestätigung „sie ist
live" fehlte genau in dem Moment, in dem sie gebraucht wird — schlimmster Fall
ist die Doppel-Anlage, weil die erste scheinbar nicht klappte. Der Hinweg
war dabei längst gebaut (Feed-Tag reist als `?date=`-Param in den Create-Flow
vor), nur die Rückrichtung fehlte — der Status quo war der asymmetrische Fall.
Dasselbe Loch hatte der Edit-Flow (ADR-0017), schärfer: verschiebt man die
Session vom Feed-Sheet aus auf einen anderen Tag, fällt sie aus dem gerade
gezeigten Tag — sie sieht nach dem Speichern aus wie gelöscht.

**Entscheidung: Nach dem Veröffentlichen springt der Feed auf den Tag der neuen
Session; nach einem Edit ebenso, sobald sich der Kalendertag geändert hat —
NUR den Tag, keinen Hallen-Vorfilter. Übergabe als One-Shot über ein
modul-globales Mini-Store (`lib/feedDayStore.ts`, Muster cropStore), nicht über
Router-Params.**

- **Tag ja:** Der Sprung ist sichtbar (Tag-Chip im Header wandert mit, ein Tap
  auf „Today" macht ihn rückgängig) und die frische Session trägt ohnehin den
  „Hosting"-Streifen — sofort auffindbar. Gleiche Regel für alle Fälle, auch
  Auswärts-Sessions mit „Stay in [Stadt]" (dort zeigt der Sprung zwar keine
  eigene Session, aber EINE Regel „nach dem Anlegen zeigt der Feed den
  Session-Tag" ist verlässlicher als eine mit Ausnahmen).
- **Halle nein:** Der Hallen-Filter ist optional, Entdeckung über
  Hallengrenzen hinweg ist gewollt (CONTEXT.md) — ein stiller Vorfilter
  versteckte den restlichen Tag. Und bei einer Auswärts-Session läge die Halle
  gar nicht in der aktiven Stadt: der Feed wäre stumm leer, exakt der Bug, den
  der Hallen-Reset beim Stadtwechsel schon abwehrt.
- **One-Shot-Store statt Router-Param:** Der Feed-Tab bleibt gemountet, ein
  Param müsste also per Effect konsumiert UND danach gelöscht werden, damit
  ein zweites Anlegen am selben Tag wieder feuert — `setParams({date:
  undefined})` ist in Expo Router v57 fürs Entfernen nicht dokumentiert. Das
  Take-einmal-dann-null-Store leistet genau das, typsicher mit echtem `Date`
  statt String-Roundtrip, und ist als pures Modul per node:test getestet.
  Abgelegt wird VOR `leaveAfterCreate`: der Feed konsumiert erst beim Fokus,
  der Sprung überlebt also auch den Auswärts-Alert.
- **Edit nur bei Tagwechsel:** Create legt immer ab (die Session soll als
  Bestätigung sichtbar sein), Edit nur, wenn der Kalendertag wirklich wandert —
  eine Notiz-/Spots-Änderung fasst den Feed-Tag nicht an. Edit kehrt per
  `router.back()` zurück (Detail, Chats-Swipe oder Feed-Sheet); das One-Shot-
  Store deckt alle drei ab, weil der Feed erst beim nächsten Fokus konsumiert.

## Betrachtete Alternativen (und warum verworfen)

- **Router-Param + Nonce** (`?date=…&nonce=…`, Effect-Dep auf die Nonce):
  funktioniert, aber verlagert das One-Shot-Problem nur in einen
  URL-Kunstgriff — das Store sagt dasselbe direkter.
- **Nach dem Anlegen in den Session-Detail/Chat springen:** stärkere
  Bestätigung, aber ein anderer Ort als der, von dem man kam — und der Chat
  ist bei frischer Session noch leer. Der Feed mit Hosting-Streifen bestätigt
  gleichwertig und lässt die Person im Entdecken-Kontext.
- **Auch die Halle vorfiltern:** siehe oben — verworfen wegen verstecktem
  Resttag und Auswärts-Leerlauf.
- **Beim Status quo bleiben:** verwirft die Bestätigungs-Lücke nicht; die
  Asymmetrie zum Hinweg (Tag reist bereits vor) bliebe bestehen.
