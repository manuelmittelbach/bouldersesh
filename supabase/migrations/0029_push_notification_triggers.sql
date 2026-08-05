-- Push-Notification-Trigger: DB-Events → send-push Edge Function (per pg_net).
--
-- Drei Ereignisse lösen Pushes aus (Abstimmung 2026-08-05):
--   request_created  — Join-Request erhalten → Push an den Host
--   request_accepted — Request angenommen    → Push an die anfragende Person
--   message_created  — neue Chat-Nachricht   → Push an Teilnehmer außer Absender
--
-- Mechanik: pg_net stellt den HTTP-Call in eine Queue, die erst NACH dem
-- Commit abgearbeitet wird — die Edge Function sieht also immer den fertigen
-- Zustand (z. B. den von handle_match_accepted erzeugten Chat), egal in
-- welcher Reihenfolge die Trigger feuern. Schlägt der Call fehl, geht nur der
-- Push verloren, nie die Transaktion.
--
-- Auth: gemeinsames Secret in Vault ('push_fn_secret', per Hand angelegt,
-- NICHT in dieser Datei). Der Trigger schickt es als Bearer, die Edge Function
-- liest es zum Vergleich über get_push_secret() (Grant nur für service_role).
-- Deploy-Voraussetzungen der Function: siehe [functions.send-push] in config.toml.
--
-- Die Projekt-URL unten ist bewusst hart kodiert (ein Projekt, kein Staging).
-- Lokale/Branch-Instanzen posten trotzdem nie nach Prod: dort fehlt das
-- Vault-Secret, und der Guard unten steigt vorher aus.

create extension if not exists pg_net with schema extensions;

-- Generische Trigger-Funktion; das Event kommt als Trigger-Argument.
-- SECURITY DEFINER, weil nur privilegierte Rollen Vault lesen dürfen.
create or replace function public.notify_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
    from vault.decrypted_secrets
   where name = 'push_fn_secret';
  -- Ohne Secret (z. B. lokale Instanz) still aussteigen statt DML zu blocken.
  if secret is null then
    return null;
  end if;

  perform net.http_post(
    url := 'https://islvhjnnomsrsrfwcaqo.supabase.co/functions/v1/send-push',
    body := jsonb_build_object(
      'event', tg_argv[0],
      'record', to_jsonb(new)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    timeout_milliseconds := 5000
  );
  return null;
end;
$$;

-- Trigger-Funktionen brauchen keine EXECUTE-Grants (Lehre aus 0027).
revoke all on function public.notify_push() from public, anon, authenticated;

-- Join-Request: neuer Request …
create trigger notify_push_request_created
  after insert on public.match_requests
  for each row
  when (new.status = 'pending')
  execute function public.notify_push('request_created');

-- … oder wiederholter Request: useCreateMatchRequest upsertet, ein erneuter
-- Request nach Rückzug ist ein UPDATE cancelled→pending, kein INSERT.
create trigger notify_push_request_repeated
  after update of status on public.match_requests
  for each row
  when (old.status is distinct from new.status and new.status = 'pending')
  execute function public.notify_push('request_created');

create trigger notify_push_request_accepted
  after update of status on public.match_requests
  for each row
  when (old.status = 'pending' and new.status = 'accepted')
  execute function public.notify_push('request_accepted');

-- Nur echte Nachrichten, keine System-Zeilen („X joined").
create trigger notify_push_message_created
  after insert on public.messages
  for each row
  when (new.kind = 'text')
  execute function public.notify_push('message_created');

-- Secret-Zugriff für die Edge Function: Sie kennt nur den service_role-Key
-- (auto-injiziert), Vault ist über PostgREST nicht erreichbar — daher dieser
-- schmale RPC, ausschließlich für service_role ausführbar.
create or replace function public.get_push_secret()
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'push_fn_secret';
$$;

revoke all on function public.get_push_secret() from public, anon, authenticated;
grant execute on function public.get_push_secret() to service_role;
