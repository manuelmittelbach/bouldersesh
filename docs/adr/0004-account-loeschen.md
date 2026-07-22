---
status: accepted
date: 2026-07-21
---

# Account-Löschung per Edge Function — Nachrichten überleben anonymisiert

## Kontext & Entscheidung

Mit [ADR-0003](./0003-profilbilder-oeffentlicher-bucket-pfade-in-der-db.md) laden
Nutzer:innen Bilder in einen **öffentlichen** Bucket. Ohne Löschpfad blieben diese
Dateien nach einem Account-Ende für immer im Netz erreichbar. Zudem verlangen die
App-Stores eine Selbstbedienungs-Löschung, und
[`auth.admin.deleteUser()` braucht den `service_role`-Key](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
— die App kann sich also nicht selbst löschen.

**Entscheidung:** Eine Edge Function `delete-account` (neues
`supabase/functions/`-Verzeichnis) identifiziert die aufrufende Person per JWT und
arbeitet in dieser Reihenfolge:

1. `avatar_path` + `gallery_paths` aus `profiles` lesen
2. diese Dateien im Bucket löschen
3. `auth.admin.deleteUser()` — die vorhandenen FK-Cascades erledigen den Rest

Gelöscht wird **endgültig**, kein Soft-Delete und keine Karenzzeit. In der App
liegt der Einstieg unten im Profil-Screen unter „Sign out"; bestätigt wird mit
**erneuter Passworteingabe** auf einem eigenen Screen, der auflistet, was
verschwindet und was bleibt.

Eine Schema-Änderung ist nötig: `messages.sender_id` wird **nullable** und
wechselt von `on delete cascade` auf `on delete set null`.

## Betrachtete Alternativen (und warum verworfen)

- **`SECURITY DEFINER`-RPC `delete_me()`** — verworfen: spart den Deploy, greift
  aber am Auth-System vorbei in dessen eigenes Schema **und kann keine
  Storage-Dateien anfassen**. Genau die sind der Anlass.
- **Nachrichten mitlöschen (heutiges Cascade-Verhalten)** — verworfen: Das
  Gegenüber behielte einen lückenhaften Verlauf, in dem es mit sich selbst zu
  reden scheint. Der Chat ist auch *dessen* Aufzeichnung.
- **Ganzen Chat löschen** — verworfen: bricht, sobald ein Chat mehr als zwei
  Mitglieder hat. `max_buddies` geht bis 8 und das `groupSessions`-Flag existiert
  bereits; ein Austritt darf den Chat nicht für vier andere zerstören.
- **Sessions als `cancelled` stehenlassen** — verworfen: bräuchte Sessions ohne
  Ersteller:in im Datenmodell und fasst damit fast jede Query und Policy an. Eine
  Session ohne Ersteller:in ist ohnehin gegenstandslos.
- **Erst Auth löschen, dann Dateien** — verworfen: Bricht Schritt 2 ab, sind die
  Bilder öffentlich abrufbar und **niemand** kann sie mehr entfernen. In der
  gewählten Reihenfolge bleibt bei einem Abbruch der Account bestehen (ohne
  Bilder) und die Person kann es erneut auslösen — ein reparierbarer Ausfall
  statt eines dauerhaften.
- **Löschauftrag in einer Tabelle + Retry-Job** — verworfen: robuster, aber
  Scheduling-Maschinerie für ein Problem, das ein Wiederholen-Knopf löst.

## Konsequenzen

- **Nachrichten der gelöschten Person bleiben lesbar.** Das ist ein bewusster
  Kompromiss zugunsten des Gegenübers, kein rechtlicher Freifahrtschein.
- Jede Stelle, die einen Absender rendert, muss `sender_id = NULL` vertragen und
  „Deleted user" anzeigen — `messages`-Query, `MessageBubble`, Chat-Liste. Ein
  1:1-Chat mit gelöschtem Gegenüber hat danach **nur noch ein Mitglied**; die
  Chat-Liste darf daran nicht zerbrechen (sie leitet den Titel heute aus den
  *anderen* Mitgliedern ab).
- Wer eine Session storniert bekommt, weil das Gegenüber sich löscht, erfährt es
  nur indirekt über den überlebenden Chat. Eine Systemnachricht („Diese Person
  hat ihren Account gelöscht") wäre klarer, bräuchte aber einen Nachrichtentyp,
  den es nicht gibt — bewusst zurückgestellt.
- Neues Deploy-Artefakt: `supabase functions deploy delete-account` gehört ab
  jetzt zum Ausrollen dazu. Der `service_role`-Key liegt ausschließlich dort.
