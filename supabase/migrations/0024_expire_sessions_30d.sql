-- Alle Sessions 30 Tage nach Session-Start hart löschen (DB-Hygiene)
--
-- Bisher wird KEINE gelebte Session je aus der DB entfernt: der 24h-Job (0019) räumt nur
-- den Chat weg, der Empty-Job (0021/0022) nur nie-bespielte Sessions 1h nach Start. Eine
-- Session mit >=1 accepted-Mitglied — oder in der je jemand war — bleibt samt ihren
-- akzeptierten `match_requests` für immer als Zeile liegen. Diese Metadaten wachsen
-- monoton. Da nichts im Client vergangene Sessions anzeigt (kein History-Feature, Profil
-- ist read-only), ist nach 30 Tagen nichts mehr davon von Wert.
--
-- 30 Tage ist bewusst großzügig: weit jenseits des 24h-Chat-Fensters (0019) und auch der
-- geparkten 7-Tage-Chat-Retention, sodass dieser Job niemals einen noch erreichbaren Chat
-- unter dem/der Nutzer:in wegzieht. Er ist reine Aufräum-Schicht HINTER allen kürzeren
-- Fenstern, kein UX-sichtbares Retention-Fenster.
--
-- Gelöscht wird die Session-ZEILE selbst; das cascaded restlos (verifiziert):
--   sessions -> match_requests (session_id, cascade, seit 0001)
--   sessions -> chats          (session_id, cascade, seit 0015)
--   chats    -> messages       (chat_id,    cascade)
--   chats    -> chat_members   (chat_id,    cascade)

-- pg_cron ist auf allen Supabase-Plänen verfügbar; Objekte landen im Schema `cron`.
create extension if not exists pg_cron;

-- Einmalig beim Anwenden: bereits >30 Tage alte Sessions sofort wegräumen.
delete from public.sessions s
where s.starts_at < now() - interval '30 days';

-- `cron.schedule` ist idempotent über den Job-Namen (re-run ersetzt statt dupliziert).
-- Täglich um 03:00 UTC: dieser Sweep braucht keine Stundengenauigkeit wie die 1h-/24h-Jobs.
select cron.schedule(
  'expire-sessions-30d',
  '0 3 * * *',
  $$
    delete from public.sessions s
    where s.starts_at < now() - interval '30 days'
  $$
);
