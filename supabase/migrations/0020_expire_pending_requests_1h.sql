-- Unbeantwortete Beitritts-Anfragen 1h nach Session-Start automatisch löschen
--
-- Eine "Requested Session" im Chats-Tab ist eine `match_requests`-Zeile mit
-- status = 'pending' (angefragt, aber noch nicht angenommen). Solange sie offen ist,
-- hat sie KEINEN Chat — es gibt also nach dem Termin nichts mehr zu planen. Bleibt die
-- Anfrage unbeantwortet, soll sie nicht ewig in der Requested-Sektion (und in der DB)
-- liegen: 1h nach `sessions.starts_at` wird die pending-Zeile hart gelöscht.
--
-- Das räumt BEIDE Seiten auf: die Requested-Sektion der anfragenden Person UND den
-- "N want to join"-Zähler der Host-Seite (getPendingCountsForSessions zählt genau
-- diese pending-Zeilen). Nur `pending` wird angefasst — `accepted` (Chat läuft),
-- `declined` und `cancelled` (bereits ausgeblendet) bleiben unberührt.
--
-- Die Client-Seite spiegelt dieselbe Grenze read-side (REQUEST_RETENTION_MS in
-- queries/sessions.ts): die Anfrage fällt dort sofort am 1h-Punkt aus der Liste,
-- dieser Job löscht sie DB-seitig innerhalb der Stunde. Gleiches Muster wie der
-- 24h-Chat-Job in Migration 0019.

-- pg_cron ist auf allen Supabase-Plänen verfügbar; Objekte landen im Schema `cron`.
create extension if not exists pg_cron;

-- Einmalig beim Anwenden: bereits abgelaufene pending-Anfragen sofort wegräumen,
-- damit alte Reste nicht erst auf den nächsten Cron-Lauf warten müssen.
delete from public.match_requests r
using public.sessions s
where r.session_id = s.id
  and r.status = 'pending'
  and s.starts_at < now() - interval '1 hour';

-- `cron.schedule` ist idempotent über den Job-Namen (re-run ersetzt statt dupliziert).
-- Stündlich: die Löschung greift innerhalb von <=1h nach dem 1h-Punkt — genau genug,
-- ohne die DB minütlich zu scannen. Die UI blendet ab 1h ohnehin schon aus.
select cron.schedule(
  'expire-pending-requests-1h',
  '0 * * * *',
  $$
    delete from public.match_requests r
    using public.sessions s
    where r.session_id = s.id
      and r.status = 'pending'
      and s.starts_at < now() - interval '1 hour'
  $$
);
