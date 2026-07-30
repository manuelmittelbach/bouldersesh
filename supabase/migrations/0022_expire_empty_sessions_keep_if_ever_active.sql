-- Empty-Session-Cron verfeinern: nur löschen, wenn NIE jemand da war
--
-- Migration 0021 löscht eigene Sessions 1h nach Start, wenn accepted_count = 0. Das ist
-- zu grob: verlässt die einzige beigetretene Person die Session (leave_session, 0016),
-- wird ihre Zeile auf 'cancelled' gesetzt → accepted_count = 0, obwohl der Gruppenchat
-- samt Verlauf ("X joined"/"X left" + echte Nachrichten) weiter existiert. Der alte
-- Job hätte diese Session (und via Cascade den Chat) 1h nach Start zerstört.
--
-- Regel jetzt: eine Session wird nur gelöscht, wenn sie NIE bespielt war —
--   (a) kein aktuelles accepted-Mitglied  UND
--   (b) der zugehörige Chat hatte nie eine Nachricht.
-- (b) unterscheidet "nie jemand da" (leerer Chat) sauber von "war jemand, ging wieder"
-- (Chat trägt mind. die 'joined'/'left'-Systemzeilen): jeder Accept erzeugt eine
-- "X joined"-Systemnachricht (handle_match_accepted, 0017). Sessions, in denen mal
-- jemand war, bleiben damit — ihr Chat wird erst vom 24h-Job (0019) weggeräumt.
--
-- `cron.schedule` ist idempotent über den Job-Namen → dies ersetzt die Job-Definition
-- aus 0021. Nur der recurring Job wird neu gesetzt; einen einmaligen Nachlauf braucht es
-- nicht (das neue Prädikat ist strikt enger, löscht also nichts, was 0021 verschont hat).

create extension if not exists pg_cron;

select cron.schedule(
  'expire-empty-sessions-1h',
  '0 * * * *',
  $$
    delete from public.sessions s
    where s.starts_at < now() - interval '1 hour'
      and not exists (
        select 1 from public.match_requests r
        where r.session_id = s.id and r.status = 'accepted'
      )
      and not exists (
        select 1 from public.chats c
        join public.messages m on m.chat_id = c.id
        where c.session_id = s.id
      )
  $$
);
