---
status: accepted
date: 2026-07-29
---

# Volle Sessions bleiben im Feed (gedimmt)

## Kontext & Entscheidung

Bisher zeigte der Entdecken-Feed **ausschließlich offene** Sessions:
`getOpenSessions` filterte `.eq("status", "open")`, volle (`matched`) fielen
heraus. Festgehalten in [ADR-0006](0006-eigenen-anfrage-status-an-der-session-zeigen.md)
und [ADR-0010](0010-rollen-label-im-feed-hosting-joined-requested.md) („der Feed
ist der **Entdecken**-Feed offener Sessions", „wird sie voll, kippt sie auf
`matched` und fällt raus") sowie im CONTEXT.md-Glossar („Volle Sessions fallen
heraus.").

Das lässt den Feed **tot wirken**. Sessions füllen sich zur Runde hin; ein Feed,
aus dem volle Sessions verschwinden, suggeriert „hier wird nichts voll" — gerade
bei **Kapazität 2** (siehe [ADR-0007](0007-gruppen-sessions-kapazitaet-2-bis-4.md)),
wo schon **eine** Zusage die Session voll macht (Trigger `handle_match_accepted`,
`0014`) und die Karte sofort ausblendet. Der Feed churnt so ständig leer, obwohl
den Tag über etwas läuft. Eine volle Session ist aber **Social Proof** („hier
verabreden sich Leute") und trägt die **Tages-Lebendigkeit** — beides geht mit dem
Ausblenden verloren.

**Entscheidung:** Der Feed lädt zusätzlich `status='matched'` im **selben
Tag-Range** (nur volle Sessions *dieses Tages* — natürlich begrenzt, kein
Altlasten-Berg). Der Statusfilter wird von `.eq("status","open")` zu
`.in("status", ["open","matched"])`; `done`/`cancelled` bleiben draußen. Der
`declinedIds`-Filter im Feed **bleibt** (abgelehnte / auto-declinte Sessions
bleiben unsichtbar).

Volle Karten stehen **gedimmt in-place, chronologisch** (nach `starts_at`, wie die
Query ohnehin sortiert) — **kein** separater „Full"-Block unten, **keine**
Gruppierung. Sie stehen zwischen den offenen in Zeitreihenfolge, nur visuell
zurückgenommen: `opacity-60` auf der `Card`, und die Spots-Zeile zeigt **„Full"**
statt „N of M spots left". **Tippen öffnet weiterhin das Detail** — man will sehen,
wer klettert (Climbers-Liste, [ADR-0009](0009-climbers-liste-accepted-kader-oeffentlich-sichtbar.md)).
Die Anfrage-Affordanz sitzt ohnehin im Detail, nicht auf der Karte; hier ändert
sich nichts.

> **Nachtrag ([ADR-0013](0013-feed-tap-oeffnet-aktions-sheet-statt-detailseite.md)):**
> Der Tap-Zielort hat sich geändert — die Karte öffnet jetzt ein Aktions-Sheet statt
> der Detailseite. Eine volle **Fremd**-Session ist dabei **gar nicht mehr tippbar**
> (kein Sheet, sie bleibt nur der gedimmte „Full"-Beleg); eine volle **eigene/
> beigetretene** öffnet das Sheet mit Löschen/Verlassen. Alles andere hier (volle
> Sessions bleiben gedimmt in-place im Feed) bleibt gültig.

**Orthogonal zu den Rollen-Labels (ADR-0010):** „Full" wird **kein vierter
Streifen**. Ist die volle Session meine (`hosting`) oder beigetreten (`joined`),
bleibt der **Rollen-Streifen** stehen und dimmt durch die Card-Opacity mit; „voll"
trägt allein Dimmung + „Full"-Spots-Zeile. Fremde volle Session → nur Dimmung +
„Full", kein Streifen. (Auf einer `matched`-Session kann ich nie `pending`/
`requested` sein — Trigger `0014` auto-declined beim Vollwerden alle offenen
Anfragen.)

**Zuschnitt:** rein Client-seitig, **keine Migration**, kein Realtime. Volle bzw.
wieder frei werdende Sessions ziehen beim nächsten Focus-Refetch / Pull-to-Refresh
nach (bestehende, akzeptierte Feed-Staleness). Tritt jemand aus einer vollen
Session aus, kippt `leave_session` (`0016`) sie zurück auf `open` — sie erscheint
dann wieder als offene, anfragbare Karte.

## Betrachtete Alternativen (und warum verworfen)

- **A — Status quo (volle raus).** Verworfen: genau das Problem — der Feed wirkt
  tot und churnt bei Kapazität 2 leer, sobald eine Zusage die Session füllt.
- **B — Nur meine eigenen vollen Sessions sichtbar.** Verworfen: löst die
  Wiederauffindbarkeit (die schon der Chats-Tab und „Your sessions" tragen), aber
  **nicht** den Lebendigkeits-/Social-Proof-Zweck — fremde volle Sessions sind
  gerade der Beleg, dass in der Halle etwas läuft.
- **C — Alle vollen, gedimmt, in-place (gewählt).** Erhält den **Tages-Zeitstrahl**
  (volle Karten stehen chronologisch zwischen den offenen, nicht in einem Block
  unten) und liefert **maximalen Social Proof**, während die Dimmung + „Full" klar
  „nicht mehr joinbar" signalisiert. Der User hat die In-place-Variante per
  ASCII-Vergleich explizit gegenüber einem separaten „Full"-Block gewählt.
- **D — Lebendigkeits-Zähler statt der Karten** („heute 5 Sessions voll geworden").
  Verworfen: abstrakt, ohne die konkreten Kletternden/Zeiten; weniger Social Proof
  als die echten Karten und ein neues UI-Element ohne Anschluss an den Feed.
