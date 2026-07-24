-- Session löschen räumt den Gruppenchat mit ab (ADR-0007 / Delete-Feature)
--
-- Bis hierher hing `chats.session_id` an `on delete set null`: eine gelöschte Session
-- ließ den Chat als sitzungslose Zombie-Runde stehen. Für die Delete-Funktion soll das
-- Löschen die Verabredung samt Gruppe auflösen — die Ersteller:in sagt ab, also geht
-- die Runde. Wir kippen den FK auf `on delete cascade`.
--
-- Damit reicht ein `delete from sessions`:
--   sessions → match_requests            (session_id, cascade, seit 0001)
--   sessions → chats                      (session_id, JETZT cascade)
--             chats → chat_members        (chat_id, cascade, seit 0001)
--             chats → messages            (chat_id, cascade, seit 0001)
-- Kein Orphan bleibt zurück.
--
-- Der FK wurde in 0001 unbenannt angelegt → Postgres-Autoname `chats_session_id_fkey`.
alter table public.chats
  drop constraint chats_session_id_fkey,
  add constraint chats_session_id_fkey
    foreign key (session_id) references public.sessions(id) on delete cascade;
