---
status: accepted
date: 2026-07-29
---

# Feed-Tap öffnet ein Aktions-Sheet statt der Detailseite

## Kontext & Entscheidung

Bisher navigierte ein Tap auf eine Feed-Karte zur **Session-Detailseite**
(`/sessions/[id]`). Dort lag der zustandsabhängige **Aktions-Balken**
(Join / Withdraw / Leave / Delete, [ADR-0006](0006-eigenen-anfrage-status-an-der-session-zeigen.md)),
und die Karte tat sonst nichts — sie war reines Sprungbrett.

Das Problem: Die Detailseite zeigt über den Aktions-Balken hinaus **fast dasselbe
wie die Karte** (Name, Note, Zeit, Halle, Kader). Als *Info*-Screen ist sie damit
weitgehend redundant — ihr einziger echter Mehrwert aus dem Feed heraus ist der
Aktions-Balken. Ein Full-Screen-Wechsel nur, um einen Knopf zu erreichen, ist zu
viel Weg für zu wenig Neues.

**Entscheidung:** Ein Tap auf die Karte öffnet ein **Bottom-Sheet**
(`SessionActionSheet`, gleiches Muster wie `CitySwitcherSheet`) mit **genau der
einen Aktion**, die zu meiner Rolle an der Session passt:

| Rolle (ADR-0010) | Sheet zeigt |
| --- | --- |
| `hosting` | „Delete session" (rot, Confirm) |
| `joined` | „Leave session" (rot, Confirm) |
| `requested` | „Request sent" + „Withdraw request" (Confirm) |
| offen, frei | „Climb together?" (Join) |
| offen, voll (Fremd-Session) | **kein Sheet** — die Karte ist nicht tippbar |

Die Rolle wird wie beim Rollen-Streifen hergeleitet (`label ?? 'open'`,
[ADR-0010](0010-rollen-label-im-feed-hosting-joined-requested.md)); die Confirm-
Dialoge und die Copy wandern **unverändert** aus dem Detail-Balken mit (ADR-0006),
damit dieselbe Handlung überall identisch klingt. Die Karte selbst bleibt **ruhig**
— bewusst **kein** Button-Wust; Avatar-Taps (→ Profil) bleiben unberührt.

Eine **volle Fremd-Session** (kein Rollen-Label + `full`) hat keine passende Handlung
und öffnet daher **gar kein Sheet**: der Feed setzt für sie schlicht **keinen
`onPress`, die Karte bleibt der gedimmte „Full"-Beleg (ADR-0011), aber nicht tippbar
(kein Ripple). Ein Sheet, das nur „No spots left" zeigt, wäre nach dem Wegfall des
Sheet-Kopfes leerer Weg für null Neues. Volle **eigene/beigetretene** Sessions öffnen
das Sheet weiterhin (Löschen/Verlassen) — dort trägt das Sheet ja eine echte Handlung.

**Die Detailseite bleibt bestehen**, ist aber **nur noch über den Info-Knopf („i")
im Chat** erreichbar (CONTEXT.md: „Jeder Chat trägt einen Info-Knopf zurück zur
Session-Detailseite"). Sie ist damit das **Nachschlage-Panel von innen** — für
Leute, die schon dabei sind: volle Note, Galerie ([ADR-0009](0009-climbers-liste-accepted-kader-oeffentlich-sichtbar.md)),
Report — **nicht mehr der Absprung von außen**.

**Nachtrag zu [ADR-0011](0011-volle-sessions-bleiben-im-feed-gedimmt.md):** Deren
Satz „Tippen öffnet weiterhin das Detail" gilt nicht mehr. Eine volle **Fremd**-Session
öffnet weder Detail noch Sheet — sie ist gedimmt und nicht tippbar. Eine volle
**eigene/beigetretene** Session öffnet das Sheet (Löschen/Verlassen). Der Rest von
ADR-0011 (volle Sessions bleiben gedimmt im Feed) bleibt unberührt.

**Bestätigung des Anfragens:** „Climb together?" schließt das Sheet **nicht**
sofort — sonst verschwände die einzige Rückmeldung. Nach Erfolg kippt das Sheet an
Ort und Stelle in einen **Bestätigungs-Block** („Request sent" + „Once the host
accepted, plan together in Chats." + leises „Withdraw request") — derselbe Block, den auch der
`requested`-Fall zeigt, damit „schon angefragt" überall gleich aussieht. Der Nutzer
schließt selbst (Backdrop-Tap). Die **löschenden** Aktionen (Delete / Leave /
Withdraw) schließen dagegen weiterhin per `onSuccess: onClose` — ihre Rückmeldung ist,
dass Karte/Sheet verschwinden.

**Zuschnitt:** rein Client-seitig, **keine Migration**, kein Realtime. Die
Query-Invalidierungen der Mutations-Hooks (`matches` / `sessions`) aktualisieren die
Karte **an Ort und Stelle** — der Rollen-Streifen erscheint/verschwindet, eine
gelöschte oder gerade voll gewordene Session fällt beim Refetch heraus. Kein
`router.back()` nötig, weil kein Screen-Wechsel mehr stattfindet.

## Betrachtete Alternativen (und warum verworfen)

- **A — Detailseite als Absprung behalten (Status quo).** Verworfen: als Info-
  Screen redundant zur Karte; der Weg (Full-Screen) lohnt den einen Knopf nicht.
- **B — Join-Button direkt auf die Karte.** Verworfen: überlädt die Karte, und
  Leave / Delete / Withdraw bräuchten trotzdem einen eigenen Platz. Der User wollte
  die Karte ausdrücklich **ruhig** halten und die Aktion erst per Tap zeigen.
- **C — Detailseite ganz abschaffen.** Verworfen: der Info-Knopf im Chat braucht
  sie weiterhin als Nachschlage-Panel (Galerie, volle Note, Report).
- **D — Aktions-Sheet bei Tap (gewählt).** Karte bleibt ruhig, ein Tap bringt genau
  die passende Handlung; die Detailseite bleibt fürs Nachschlagen aus dem Chat.
