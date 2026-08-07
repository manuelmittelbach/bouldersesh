-- Session-Edit (ADR-0017): Folge-Effekte einer Änderung als Trigger.
--
-- Der Client (useUpdateSession) schreibt nur die Zeile — gym_id, starts_at, note,
-- capacity. Was daraus folgt, entscheidet die DB, damit es für jeden Schreibweg gilt:
--   1. Kapazitäts-Änderung → Status nachziehen (matched ↔ open) + Floor-Guard
--   2. Zeit-/Hallen-Änderung → System-Zeile in den Session-Chat („Session moved to …")
--   3. Zeit-/Hallen-Änderung → Push an die Mitglieder (notify_push aus 0029)
--
-- Notiz-/Spots-Änderungen lösen bewusst KEINEN Push und keine System-Zeile aus
-- (ADR-0017: nur „wann, wo" verschiebt die Verabredung real).

-- ------------------------------------------------------------------
-- 1. Kapazitäts-Änderung: Status nachziehen (ADR-0017)
-- ------------------------------------------------------------------
-- Vergrößern einer vollen Session öffnet sie wieder (matched → open) — OHNE die
-- auto-abgelehnten Anfragen wiederzubeleben (die DB unterscheidet Auto- nicht von
-- Host-Ablehnung; wer noch will, fragt neu an). Schrumpfen auf „genau voll" verhält
-- sich wie das Füllen des letzten Platzes (0014): matched + offene Anfragen ablehnen.
-- Schrumpfen UNTER die Besetzung ist ausgeschlossen: angenommene Anfragen sind
-- verbindlich — der Client sperrt die Chips, dieser Guard hält die Invariante auch
-- gegen direkte API-Calls.
create or replace function public.handle_session_capacity_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_accepted int;
begin
  select count(*) into v_accepted
  from public.match_requests
  where session_id = new.id and status = 'accepted';

  -- Floor-Guard: capacity − 1 Plätze für andere, die Besetzung darf nicht überhängen.
  if v_accepted > new.capacity - 1 then
    raise exception 'capacity below occupied spots';
  end if;

  if v_accepted >= new.capacity - 1 then
    -- Genau voll geworden: wie das Füllen des letzten Platzes (0014).
    update public.sessions set status = 'matched'
      where id = new.id and status = 'open';
    update public.match_requests set status = 'declined'
      where session_id = new.id and status = 'pending';
  else
    -- Wieder Platz: die volle Session ist erneut anfragbar.
    update public.sessions set status = 'open'
      where id = new.id and status = 'matched';
  end if;

  return new;
end;
$$;

revoke all on function public.handle_session_capacity_changed() from public, anon, authenticated;

-- Die verschachtelten Status-Updates setzen `capacity` nicht → keine Rekursion
-- (UPDATE OF capacity feuert nur, wenn capacity im SET steht; die WHEN-Klausel
-- filtert zusätzlich unveränderte Werte, der Client schickt immer alle Felder).
create trigger session_capacity_changed
  after update of capacity on public.sessions
  for each row
  when (old.capacity is distinct from new.capacity)
  execute function public.handle_session_capacity_changed();

-- ------------------------------------------------------------------
-- 2. Zeit-/Hallen-Änderung: System-Zeile in den Chat
-- ------------------------------------------------------------------
-- Dauerhaft dokumentiert für alle ohne Push — der Push-Deep-Link landet direkt auf
-- dieser Erklärung. kind='system' mit sender = Host (Muster „X joined"/„X left",
-- 0014/0016); der Nachrichten-Push-Trigger (0029) feuert nur bei kind='text',
-- also kein Doppel-Push. Zeitformat fest in Europe/Berlin: alle Städte/Hallen
-- liegen in Deutschland, der Body ist eingebackener Text (wie die Namen in
-- „X joined") und wird clientseitig nicht umformatiert.
create or replace function public.handle_session_moved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_chat_id uuid;
  v_gym_name text;
begin
  select id into v_chat_id
  from public.chats where session_id = new.id
  limit 1;

  -- Jede Session hat seit 0017 einen Chat; fehlt er doch, gibt es nichts anzusagen.
  if v_chat_id is null then
    return new;
  end if;

  select name into v_gym_name from public.gyms where id = new.gym_id;

  insert into public.messages (chat_id, sender_id, body, kind)
  values (
    v_chat_id,
    new.creator_id,
    'Session moved to '
      || to_char(new.starts_at at time zone 'Europe/Berlin', 'FMMon FMDD, HH24:MI')
      || coalesce(' · ' || v_gym_name, ''),
    'system'
  );

  return new;
end;
$$;

revoke all on function public.handle_session_moved() from public, anon, authenticated;

create trigger session_moved
  after update of starts_at, gym_id on public.sessions
  for each row
  when (
    old.starts_at is distinct from new.starts_at
    or old.gym_id is distinct from new.gym_id
  )
  execute function public.handle_session_moved();

-- ------------------------------------------------------------------
-- 3. Zeit-/Hallen-Änderung: Push an die Mitglieder
-- ------------------------------------------------------------------
-- Gleiche Bedingung wie die System-Zeile; notify_push (0029) schickt die Session-
-- Zeile per pg_net an send-push. Empfänger bestimmt die Edge Function: Chat-
-- Mitglieder außer Host (= angenommene Mitglieder, ADR-0017 — pending Requester
-- bekommen bewusst keinen Push). pg_net feuert erst nach Commit, die Function
-- sieht also die fertige Zeile samt neuem Gym.
create trigger notify_push_session_updated
  after update of starts_at, gym_id on public.sessions
  for each row
  when (
    old.starts_at is distinct from new.starts_at
    or old.gym_id is distinct from new.gym_id
  )
  execute function public.notify_push('session_updated');
