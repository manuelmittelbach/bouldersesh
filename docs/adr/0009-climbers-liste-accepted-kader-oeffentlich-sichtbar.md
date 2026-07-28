---
status: accepted
date: 2026-07-28
---

# „Climbers"-Liste: bestätigter Kader öffentlich sichtbar

## Kontext & Entscheidung

ADR-0007 machte Sessions zu Gruppen (Kapazität 2–4). Die Session-Detailseite zeigte
danach zwar die **Zahl** freier Plätze (`accepted_count`), aber nicht, **wer** schon
dabei ist. Genau diese Person — die überlegt beizutreten — öffnet die Detailseite;
ihr fehlte das Gesicht der Gruppe. Die RLS-Policy auf `match_requests` (0002) ließ
Anfrage-Zeilen nur die **Anfragende:n** (eigene Zeile) und die **Ersteller:in**
(Zeilen an eigenen Sessions) lesen — ein fremder Blick sah niemanden.

**Entscheidung:**

- **Die Detailseite zeigt eine „Climbers"-Liste des bestätigten Kaders.** Tippbare
  Zeilen (Avatar · Name · optionales Niveau-Pill) unter dem Info-Block, jede führt
  zum read-only Profil (`profile/[id]`, wie Ersteller-Block und Feed-Avatare). Leer →
  ausgeblendet: „Spots left" oben trägt den Nullfall schon.
- **„Climbers" = nur die angenommenen Mitkletternden (`status='accepted'`), OHNE die
  Ersteller:in.** Die Ersteller:in hat oben ihren eigenen Hero-Block; sie doppelt in
  der Liste zu führen wäre redundant. (Zur Kapazität zählt sie weiter mit — ADR-0007 —,
  die Liste ist eine reine Anzeige der Beigetretenen, kein Kapazitäts-Zähler.)
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
- **Ersteller:in als „Host" in die Liste** — verworfen: doppelt den Hero-Block.
