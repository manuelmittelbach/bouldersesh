---
status: accepted
date: 2026-07-28
---

# „Climbers"-Liste: bestätigter Kader öffentlich sichtbar

> **Update (ADR-0018, 2026-08-07):** Der Punkt „Realtime hält die Liste live"
> ist abgelöst — die Detailseite ist seither ein Snapshot beim Öffnen
> (`refetchOnMount: "always"`, kein Realtime-Abo mehr in `useSessionClimbers`).
> Alle übrigen Entscheidungen gelten weiter.

## Kontext & Entscheidung

ADR-0007 machte Sessions zu Gruppen (Kapazität 2–4). Die Session-Detailseite zeigte
danach zwar die **Zahl** freier Plätze (`accepted_count`), aber nicht, **wer** schon
dabei ist. Genau diese Person — die überlegt beizutreten — öffnet die Detailseite;
ihr fehlte das Gesicht der Gruppe. Die RLS-Policy auf `match_requests` (0002) ließ
Anfrage-Zeilen nur die **Anfragende:n** (eigene Zeile) und die **Ersteller:in**
(Zeilen an eigenen Sessions) lesen — ein fremder Blick sah niemanden.

**Entscheidung:**

- **Die Detailseite zeigt eine „Climbers"-Zeile im Info-Block** (gleicher Stil wie
  When/Where): Label „Climbers", daneben eine kompakte Reihe **kleiner Avatare** statt
  Text. Jeder Avatar ist tippbar zum read-only Profil (`profile/[id]`, wie die
  Feed-Avatare). Namen/Niveau-Pills bewusst weggelassen — die Zeile ist ein Überblick
  „wer ist dabei", die Details holt man sich per Tap im Profil.
- **Die freien Plätze stehen dezent hinter den Avataren** („N spots left" / „Full"),
  keine eigene „Spots"-Zeile mehr: die belegten Plätze zeigen ja die Avatare selbst,
  die Zahl daneben ergänzt nur den Rest. Spart eine Info-Zeile, ohne etwas zu verlieren.
- **Host zuerst, dann die angenommenen Mitkletternden (`status='accepted'`).** Der:die
  Ersteller:in zählt zur Runde (ADR-0007) und steht darum als erster Avatar — trotz
  des eigenen Hero-Blocks oben: als *ein* Gesicht in der Reihe ist die Doppelung
  minimal und macht „wer ist dabei" auf einen Blick vollständig. Die Zeile steht darum
  immer (der Host ist immer dabei).
- **RLS öffnet den bestätigten Kader öffentlicher Sessions für alle Authentifizierten**
  (Migration `0018`): dritte OR-Klausel `status='accepted' and session ∈ public`.
  Pending/declined/cancelled bleiben privat wie zuvor. Offen liegt allein die Tatsache,
  dass Person X einer öffentlichen Session beigetreten ist — Profile selbst sind
  ohnehin für alle Authentifizierten lesbar (0002), also die einzige neue Offenlegung.
- **Realtime hält die Liste live** (`useSessionClimbers`, useId-Kanal wie
  `useRequestsForSession`). Das Wachsen (jemand wird angenommen) sieht **jede:r** live.
  Das Schrumpfen (jemand verlässt → `cancelled`, 0016) sieht — weil die neue Zeile
  `cancelled` für Außenstehende unsichtbar ist und Realtime RLS auf der neuen Zeile
  prüft — nur Ersteller:in/Mitglieder live; Außenstehende ziehen beim nächsten
  Refetch (Focus/Remount) nach. Bewusst in Kauf genommen: geringe Staleness, selbst-
  heilend, und kein Rückschritt gegenüber vorher (Detailseite war für Außenstehende nie
  live).

## Betrachtete Alternativen (und warum verworfen)

- **Kader nur für Beteiligte (Ersteller:in + Mitglieder) sichtbar** — verworfen: die
  Liste ist gerade für die Außenstehende gedacht, die beim Beitritt hilft; für sie
  wäre sie dann unsichtbar.
- **SECURITY-DEFINER-RPC statt Policy-Erweiterung** — verworfen: mehr Code für dieselbe
  Offenlegung; die Policy-Klausel bleibt in der etablierten RLS-Struktur (vgl. 0002).
- **Kader in `SESSION_SELECT` einbetten** — verworfen: der Feed (`useOpenSessions`)
  teilt dieses SELECT und braucht nur den Count; volle Profile pro Feed-Karte wären
  Verschwendung. Eigener Hook `useSessionClimbers`, nur auf der Detailseite aktiv.
- **Eigene „Climbers"-Card mit Namens-Zeilen + Niveau-Pills** (erster Entwurf) —
  verworfen: zu schwer für die Info. Die kompakte Avatar-Reihe im bestehenden
  Info-Block fügt sich ruhiger ein; Namen/Niveau holt man per Tap.
- **Host aus der Reihe lassen (nur Beigetretene)** — verworfen: „wer ist dabei" soll
  vollständig sein; der Host als erster Avatar ist die kleinere Irritation als eine
  Reihe, in der die Gastgeber:in fehlt.
