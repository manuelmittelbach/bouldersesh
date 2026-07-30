-- Gruppenchat 24h nach Session-Start automatisch löschen
--
-- Der Chat einer Runde soll während UND kurz nach dem Bouldern erreichbar bleiben,
-- dann aber verschwinden — nicht ewig im Chats-Tab (und in der DB) liegen. Regel:
-- 24h nach `sessions.starts_at` wird der Chat hart gelöscht. Die Client-Seite spiegelt
-- dieselbe Grenze read-side (CHAT_RETENTION_MS in queries/sessions.ts) — die Session-
-- Zeile fällt dort ab `starts_at + 24h` aus Hosting/Joined; dieser Job räumt die
-- zugehörigen Chat-Daten in der DB weg, damit beide Seiten konsistent bleiben.
--
-- Gelöscht wird nur der `chats`-Eintrag, NICHT die Session — der Chat cascaded weiter:
--   chats → chat_members  (chat_id, cascade, seit 0001)
--   chats → messages      (chat_id, cascade, seit 0001)
-- Die Session bleibt als Vergangenheits-Zeile stehen (wie alle abgelaufenen Sessions);
-- `handle_session_created` (0017) feuert nur AFTER INSERT und legt keinen Chat neu an.

-- pg_cron ist auf allen Supabase-Plänen verfügbar; Objekte landen im Schema `cron`.
create extension if not exists pg_cron;

-- `cron.schedule` ist idempotent über den Job-Namen (re-run ersetzt statt dupliziert).
-- Stündlich: die Löschung greift innerhalb von <=1h nach dem 24h-Punkt — genau genug,
-- ohne die DB minütlich zu scannen.
select cron.schedule(
  'expire-chats-24h',
  '0 * * * *',
  $$
    delete from public.chats c
    using public.sessions s
    where c.session_id = s.id
      and s.starts_at < now() - interval '24 hours'
  $$
);
