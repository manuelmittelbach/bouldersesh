-- Group sessions: capacity 2–4 (ADR-0007)
--
-- A Session stops being 1:1 by construction and becomes a group of 2–4 climbers
-- (creator included) that fills over time. This migration:
--   1. replaces `max_buddies` with `capacity` (party size incl. creator),
--   2. gives `messages` a `kind` so a join can drop a system line into the chat,
--   3. rewrites `handle_match_accepted`: one growing chat per session, flip to
--      `matched` (= "full") only on the last spot, auto-decline the rest.

-- ------------------------------------------------------------------
-- 1. capacity replaces max_buddies
-- ------------------------------------------------------------------
-- Kanonische Einheit ist die Party-Größe INKL. Ersteller:in (CONTEXT.md → Kapazität),
-- 2–4. `max_buddies` (1..8, nie befüllt außer Default 1) wird gedroppt; der Off-by-one
-- entfällt. Der add-Default 2 füllt Altzeilen, der Backfill überschreibt sie präzise.
alter table public.sessions
  add column capacity int not null default 2 check (capacity between 2 and 4);

update public.sessions
  set capacity = least(max_buddies + 1, 4);

alter table public.sessions drop column max_buddies;

-- ------------------------------------------------------------------
-- 2. messages.kind — system lines ("Ben joined")
-- ------------------------------------------------------------------
-- `sender_id IS NULL` heißt bereits „Absender:in gelöscht" (ADR-0004), also NICHT
-- wiederverwenden. Eine System-Zeile trägt `kind='system'` und behält eine echte
-- sender_id (die beitretende Person) — so bleibt die Null-Semantik unangetastet.
alter table public.messages
  add column kind text not null default 'text'
    check (kind in ('text', 'system'));

-- ------------------------------------------------------------------
-- 3. handle_match_accepted — growing group chat + fill-on-last-spot
-- ------------------------------------------------------------------
-- Ersetzt „first accept wins": pro Session EIN Chat, der wächst. Erste Annahme öffnet
-- ihn (Ersteller:in + Anfragende); jede weitere nimmt nur die Anfragende auf und legt
-- eine System-Zeile in den Chat. Erreicht die Zahl der angenommenen Anfragen
-- `capacity - 1` (die Ersteller:in hält den ersten Platz), kippt die Session auf
-- `matched` (= voll) und alle noch offenen Anfragen werden abgelehnt — kein Zombie.
create or replace function public.handle_match_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
  v_creator_id uuid;
  v_capacity int;
  v_accepted_count int;
  v_joiner_name text;
begin
  if new.status <> 'accepted' or old.status = 'accepted' then
    return new;
  end if;

  select creator_id, capacity into v_creator_id, v_capacity
  from public.sessions where id = new.session_id;

  -- Existiert schon ein Chat für diese Session?
  select id into v_chat_id
  from public.chats where session_id = new.session_id
  limit 1;

  if v_chat_id is null then
    -- Erste Annahme: Chat öffnen, Ersteller:in + Anfragende aufnehmen.
    insert into public.chats (session_id) values (new.session_id)
    returning id into v_chat_id;

    insert into public.chat_members (chat_id, user_id) values
      (v_chat_id, v_creator_id),
      (v_chat_id, new.requester_id);
  else
    -- Spätere Annahme: nur die Anfragende dazu, und den Beitritt ansagen.
    insert into public.chat_members (chat_id, user_id)
    values (v_chat_id, new.requester_id)
    on conflict do nothing;

    select coalesce(nullif(display_name, ''), 'Someone') into v_joiner_name
    from public.profiles where id = new.requester_id;

    insert into public.messages (chat_id, sender_id, body, kind)
    values (v_chat_id, new.requester_id, v_joiner_name || ' joined', 'system');
  end if;

  -- Platz-Rechnung: die Ersteller:in hält einen Platz, angenommene Anfragen den Rest.
  -- Der AFTER-Trigger sieht die aktuelle Zeile bereits als 'accepted', also zählt sie mit.
  select count(*) into v_accepted_count
  from public.match_requests
  where session_id = new.session_id and status = 'accepted';

  if v_accepted_count >= v_capacity - 1 then
    update public.sessions set status = 'matched' where id = new.session_id;
    -- Voll → alle noch offenen Anfragen können nie mehr durchkommen: ablehnen.
    -- Das feuert den Trigger erneut, fällt aber oben durch (status <> 'accepted').
    update public.match_requests
      set status = 'declined'
      where session_id = new.session_id and status = 'pending';
  end if;

  return new;
end;
$$;

-- messages/chat_members stehen seit 0004 in der Realtime-Publikation; die neue
-- `kind`-Spalte und die System-Inserts reisen automatisch mit. Kein Publikations-Umbau.
