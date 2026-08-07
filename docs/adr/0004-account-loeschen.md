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

## Update 2026-08-07 — Bestätigung ohne Passwort + Apple-Token-Revocation

Mit dem nativen Social-Login (ADR-0016) brach die ursprüngliche Bestätigung:
Apple-/Google-Konten **haben kein Passwort** — sie konnten ihren Account gar
nicht löschen (App-Store-Ablehnungsgrund, Richtlinie 5.1.1(v)). Zwei Änderungen:

1. **Bestätigt wird jetzt für alle durch Eintippen von `DELETE`** statt per
   Passwort. Die Passwort-Reauth schützte ohnehin weniger als gedacht (wer das
   entsperrte Gerät hat, hat auch das Mail-Postfach für „Passwort vergessen");
   die eigentliche Aufgabe der Hürde — impulsives/versehentliches Löschen
   verhindern — erfüllt die Tipp-Bestätigung methodenunabhängig. Ein nativer
   Re-Auth-Flow (Apple-Sheet erneut) wurde als Overkill verworfen.
2. **Apple-Token-Revocation** (App-Store-Pflicht seit 2022): Beim Apple-Login
   schickt die App Apples `authorizationCode` an die neue Edge Function
   `apple-token-exchange`, die ihn gegen einen Refresh-Token tauscht und in
   `apple_refresh_tokens` ablegt (Migration 0032; service_role-only, kein
   Client-Zugriff). `delete-account` liest den Token vor dem `deleteUser`
   (FK-Cascade!) und widerruft ihn **danach, Best-Effort**: Ein Apple-Ausfall
   darf das Löschen nicht blockieren — schlimmstenfalls bleibt die App in den
   Apple-ID-Einstellungen sichtbar und ist dort manuell entfernbar.

Beides braucht die SIWA-Secrets `APPLE_TEAM_ID`, `APPLE_SIWA_KEY_ID`,
`APPLE_SIWA_PRIVATE_KEY` (Function-Secrets; Key aus dem Apple Developer
Portal). Fehlen sie, wird die Revocation still übersprungen — Löschen
funktioniert immer.
