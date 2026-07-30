-- Leere eigene Sessions (niemand beigetreten) 1h nach Session-Start hart löschen
--
-- ACHTUNG: Das `not exists (accepted)`-Prädikat unten ist zu grob — es trifft auch
-- Sessions, in denen mal jemand war und wieder GING (leave_session setzt die Zeile auf
-- 'cancelled', nicht 'accepted', also accepted_count = 0), obwohl deren Chat samt
-- Verlauf existiert. Migration 0022 verfeinert den laufenden Cron-Job daher um eine
-- zweite Bedingung (Chat hatte nie eine Nachricht). Diese Datei bleibt als History
-- stehen; die maßgebliche Job-Definition ist die aus 0022.
--
-- Eine Session, der WIRKLICH nie jemand beigetreten ist, hat einen leeren Chat und keine
-- Mitkletternden — nach dem Termin gibt es nichts mehr zu planen und nichts zu bewahren.
-- Solche Sessions sollen nicht die vollen 24h (Chat-Fenster, 0019) im Hosting-Abschnitt
-- liegen, sondern 1h nach `starts_at` verschwinden. Nur Sessions mit MEHREREN Leuten
-- (Host + >=1 accepted) — oder in denen mal jemand war — leben länger.
--
-- Gelöscht wird die Session-ZEILE selbst; das cascaded:
--   sessions -> match_requests (session_id, cascade, seit 0001)
--   sessions -> chats          (session_id, cascade, seit 0015)

-- pg_cron ist auf allen Supabase-Plänen verfügbar; Objekte landen im Schema `cron`.
create extension if not exists pg_cron;

-- Einmalig beim Anwenden: bereits abgelaufene leere Sessions sofort wegräumen.
delete from public.sessions s
where s.starts_at < now() - interval '1 hour'
  and not exists (
    select 1 from public.match_requests r
    where r.session_id = s.id and r.status = 'accepted'
  );

-- `cron.schedule` ist idempotent über den Job-Namen (re-run ersetzt statt dupliziert).
-- Stündlich, wie die 24h-/pending-Jobs: greift innerhalb von <=1h nach dem 1h-Punkt.
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
  $$
);
