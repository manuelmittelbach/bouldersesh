-- Chat für mich ausblenden ("löschen" aus Nutzersicht), ohne den Chat oder das
-- Gegenüber zu berühren. `hidden_at` merkt sich, WANN ich den Chat ausgeblendet
-- habe. Kommt danach eine neue Nachricht (sent_at > hidden_at), zeigt der Client
-- den Chat wieder an (Filter clientseitig in getMyChats) — genau das gewünschte
-- "taucht bei neuer Nachricht wieder auf".
--
-- Kein neues DELETE/Policy nötig: das bestehende "chat_members update own"-Policy
-- (0002) erlaubt bereits das Aktualisieren der EIGENEN Zeile, und nur die eigene
-- hidden_at wird gesetzt. Das Gegenüber sieht nichts davon.
alter table public.chat_members
  add column if not exists hidden_at timestamptz;
