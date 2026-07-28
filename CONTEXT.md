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

Eine Session ist eine **Gruppe von 2 bis 4 Kletternden** — die Ersteller:in
**zählt mit**. Sie füllt sich über die Zeit: die Ersteller:in ist von Anfang an
der erste Platz, jede angenommene [Anfrage](#anfrage-match-request) besetzt einen
weiteren. Solange Plätze offen sind, bleibt die Session im Feed und nimmt
Anfragen; mit dem letzten Platz ist sie **voll** und verschwindet aus dem Feed.

Eine Session trägt **keinen** strukturierten Kletter-Grade. Was jemand vorhat,
steht in der (verpflichtenden) Notiz. Das Niveau, das an einer Session erscheint,
ist das **der Ersteller:in** — ein Merkmal der Person, nicht der Session.

## Kapazität (Capacity)

Die **Gesamtzahl** der Kletternden, die eine Session fassen soll —
**inklusive Ersteller:in**, 2 bis 4. Von der Ersteller:in beim Anlegen gewählt.

Die kanonische Einheit ist die **Party-Größe, nicht „Buddies"**: „Gruppe von 4"
heißt Ersteller:in + 3 weitere. Ein Platz gilt als besetzt durch die Ersteller:in
(immer) oder durch eine angenommene Anfrage; „2 Plätze frei" = Kapazität minus
besetzte Plätze.

_Avoid_: max_buddies, „N Buddies gesucht" (perpetuiert den Off-by-one)

## Niveau (Skill Level)

Die grobe Selbsteinschätzung einer Person — beginner / intermediate / advanced /
pro. **Optional** und **gym-unabhängig**: ein weiches soziales Signal, keine
Filtergröße und kein hallen-bezogener Grade. Gehört zur Person, erscheint als
Pill am Profil und an deren Sessions; fehlt es, wird kein Pill gezeigt.

_Avoid_: Grade, Preferred level

## Session-Notiz (Note)

Der Freitext an einer Session, der sagt, was jemand an diesem Tag klettern will
(„trying to crack some reds"). **Pflicht** — eine Session ohne Notiz gibt es
nicht. Sie ist der ehrliche, **hallen-relative** Ausdruck des Vorhabens: lesbar,
weil die Session eine Halle hat. Ersetzt den früheren strukturierten
Session-Grade.

_Avoid_: Preferred level, Grade

## Anfrage (Match Request)

Die Bitte einer anderen Person, bei einer Session mitzuklettern
(„Klettern mit?"). **Nicht zu verwechseln mit den Einträgen im Feed** — der
Feed zeigt offene *Sessions*, keine Anfragen.

Die Ersteller:in nimmt Anfragen an oder lehnt sie ab; **jede Annahme besetzt
einen Platz**, bis die [Kapazität](#kapazität-capacity) erreicht ist. Mit dem
letzten Platz werden alle noch offenen Anfragen **automatisch abgelehnt** — kein
Zombie-Zustand, in dem eine Anfrage ewig hängt. Eine noch offene (pending)
Anfrage lässt sich zurückziehen; eine bereits **angenommene ist verbindlich**
(kein Austreten in v1).

Die angenommenen Kletternden teilen sich **einen** [Session-Chat](#session-chat).

## Session-Chat (Session Chat)

Der **eine** Chat, der zu einer Session gehört. Mitglieder sind die Ersteller:in
und alle angenommenen Kletternden — bei einer Zweier-Session also zwei, bei einer
Vierer-Session bis zu vier. Entsteht **mit der Session** (ADR-0008): die
Ersteller:in ist von Anfang an alleiniges Mitglied, der Chat wächst mit jeder
Annahme. Solange sie allein ist, trägt der Kopf statt eines Namens die
**Session-Kennung „Halle · Zeit"** und die Nachrichtenliste einen weichen
Leerzustand.

Er bleibt sonst **personen-zentriert**: sobald wer dabei ist, zeigt eine
Zweier-Session in Liste und Kopf die eine Gegenperson (wie bisher), eine Gruppe die
Mitglieder („Anna, Ben +1") mit gestapelten Avataren — nicht die Halle. Nachrichten
tragen ihre Absender:in, weil mehr als zwei Leute schreiben können.

Die **Beitritts-Anfragen leben allein im Chat** (ADR-0008), oben angeheftet und dort
angenommen/abgelehnt — die Session-Detailseite zeigt sie nicht mehr. Jeder Chat trägt
einen **Info-Knopf** zurück zur Session-Detailseite. Tritt jemand bei, erscheint eine
**System-Zeile** („Ben joined") — eine Meta-Nachricht ohne menschliche Absender:in, zu
unterscheiden von einer Zeile einer gelöschten Person (dort ist `sender_id` null,
ADR-0004; die System-Zeile braucht ein eigenes Kennzeichen).

## Entdecken-Feed (Feed)

Die Liste offener, öffentlicher Sessions in der aktiven Stadt, gemischt über
alle Hallen dieser Stadt. Die Halle ist darin ein **optionaler Filter**, nicht
eine zweite Pflicht-Auswahlstufe — Entdeckung über Hallengrenzen hinweg ist
gewollt.

Eine Session bleibt hier, **solange Plätze frei sind**; die Karte zeigt die
verbleibenden Plätze („2 Plätze frei"). Volle Sessions fallen heraus.
