# Boulder Buddy — Ubiquitous Language

Glossar der Domänenbegriffe. Keine Implementierungsdetails — Entscheidungen gehören
nach `docs/adr/`.

## Stadt (City)

Ein Ort, an dem gebouldert wird. Städte sind **gleichberechtigt** — es gibt keine
„Heimatstadt" und keine Rangfolge. Eine Stadt hat einen Namen und bündelt die
Hallen, die in ihr liegen.

Städte sind **kuratiert**: sie werden gepflegt, nicht von Nutzer:innen angelegt.

## Aktive Stadt (Active City)

Die Stadt, die zuletzt gewählt wurde. Sie ist der Kontext, in dem der
Entdecken-Feed Sessions zeigt.

Die aktive Stadt ist eine **Geräte-Präferenz, kein Profil-Attribut** — die App
merkt sie sich lokal, sie wird nicht mit dem Account synchronisiert und sagt
nichts darüber aus, wo jemand „wohnt".

Reichweite: die aktive Stadt filtert **ausschließlich den Entdecken-Feed**.
Chats, Match-Anfragen, eigene Sessions und das Profil sind niemals
stadtgefiltert — eine bestehende Verabredung verschwindet nicht, weil man die
Stadt wechselt.

## Halle (Gym)

Eine konkrete Boulderhalle. Jede Halle liegt in genau **einer** Stadt. Eine
Session findet immer in einer Halle statt, nie „irgendwo in der Stadt".

Hallen sind derzeit kuratiert. Nutzer:innen dürfen sie (noch) nicht anlegen.

## Stammhalle (Home Gym)

Die Halle, die jemand im Profil als seine übliche hinterlegt. Optional.
**Unabhängig von der aktiven Stadt** — die Stammhalle bestimmt nicht, welche
Stadt der Feed zeigt, und die aktive Stadt ändert die Stammhalle nicht.

## Avatar

Das Bild, das eine Person überall dort vertritt, wo sie nur beiläufig vorkommt —
in Listen, an Sessions, neben Nachrichten. Klein, rund, auf Wiedererkennung
angelegt. Jede Person hat höchstens einen.

Ein Avatar ist **kein Galeriefoto**: er wird eigenständig gewählt und ist nicht
das erste Bild einer Reihe.

## Galeriefoto

Ein Bild, das jemand seinem Profil hinzufügt, um zu zeigen, wie er klettert.
Galeriefotos sind für **andere** da — sie werden erst sichtbar, wenn jemand ein
Profil bewusst öffnet, und tauchen nirgends beiläufig auf.

## Gelöschte Nutzer:in (Deleted User)

Kein Zustand, sondern eine **Leerstelle**: Wer seinen Account löscht, hört auf zu
existieren — Profil, Sessions und Anfragen verschwinden mit.

Was bleibt, sind die **Nachrichten**, die die Person geschrieben hat. Sie gehören
auch dem Gegenüber, dessen Verlauf sonst Löcher hätte. Dort erscheint die Person
als „Deleted user" — nicht als Person mit einem Zustand, sondern als
Absender-Position ohne Absender:in.

## Meldung (Report)

Der Hinweis einer Person, dass ein Profil unangemessen ist. Eine Meldung
**entfernt nichts** — sie legt einen Vorgang an, über den ein Mensch entscheidet.

## Session

Die Ankündigung „ich klettere zu dieser Zeit in dieser Halle und suche
Buddies". Gehört genau einer Person (Ersteller:in) und genau einer Halle —
und damit implizit einer Stadt.

## Anfrage (Match Request)

Die Bitte einer anderen Person, bei einer Session mitzuklettern
(„Klettern mit?"). **Nicht zu verwechseln mit den Einträgen im Feed** — der
Feed zeigt offene *Sessions*, keine Anfragen. Wird eine Anfrage angenommen,
entsteht ein Match und damit ein Chat.

## Entdecken-Feed (Feed)

Die Liste offener, öffentlicher Sessions in der aktiven Stadt, gemischt über
alle Hallen dieser Stadt. Die Halle ist darin ein **optionaler Filter**, nicht
eine zweite Pflicht-Auswahlstufe — Entdeckung über Hallengrenzen hinweg ist
gewollt.
