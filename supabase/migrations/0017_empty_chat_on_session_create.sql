-- Empty chat on session create + requests live only in the chat (ADR-0008)
--
-- Bisher entstand der Chat erst bei der ersten Zusage. Dadurch war eine leere eigene
-- Session nur über die Detailseite erreichbar — und sobald sie voll war (`matched`),
-- fiel sie aus dem Feed und war gar nicht mehr erreichbar. Ab hier gilt: ein Chat
-- existiert vom Moment der Session-Erstellung an (Ersteller:in als einziges Mitglied).
-- Die Beitritts-Anfragen leben allein im Chat (oben angeheftet), die Detailseite zeigt
-- sie nicht mehr. Diese Migration:
--   1. legt bei jedem Session-INSERT den Chat + die Ersteller:in als Mitglied an,
--   2. vereinfacht `handle_match_accepted` (der Chat ist jetzt immer schon da),
--   3. füllt fehlende Chats für bestehende ZUKÜNFTIGE eigene Sessions nach.

-- ------------------------------------------------------------------
-- 1. handle_session_created — leerer Chat bei jeder neuen Session
-- ------------------------------------------------------------------
-- SECURITY DEFINER (wie handle_match_accepted): der Trigger schreibt an der RLS vorbei
-- in chats/chat_members. Die Ersteller:in wird sofort Mitglied — die membership-basierte
-- RLS (0005) lässt sie damit ihren eigenen Solo-Chat lesen/schreiben, ohne Policy-Umbau.
-- Der chat_members-INSERT feuert zugleich das Realtime, das useMyChats bereits abonniert
-- (chat_members INSERT gefiltert auf user_id) → der leere Chat erscheint live.
create or replace function public.handle_session_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
begin
  insert into public.chats (session_id) values (new.id)
  returning id into v_chat_id;

  insert into public.chat_members (chat_id, user_id)
  values (v_chat_id, new.creator_id);

  return new;
end;
$$;

create trigger on_session_created
  after insert on public.sessions
  for each row execute function public.handle_session_created();

-- ------------------------------------------------------------------
-- 2. handle_match_accepted — Chat existiert jetzt immer
-- ------------------------------------------------------------------
-- Der „erste Zusage legt Chat + Ersteller:in an"-Zweig (0014) ist tot: der Chat kommt
-- jetzt schon bei der Session-Erstellung. Jede Zusage nimmt nur noch die Anfragende auf
-- und legt eine System-Zeile („X joined") in den Chat — auch die erste. Ein winziger
-- defensiver Fallback legt den Chat an, falls eine (nicht nachgefüllte) Altzeile doch
-- keinen hat, damit keine Zusage hängen bleibt.
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

  select id into v_chat_id
  from public.chats where session_id = new.session_id
  limit 1;

  -- Defensiv: sollte eine Altzeile wider Erwarten keinen Chat haben, hier anlegen
  -- (inkl. Ersteller:in), statt die Zusage hängen zu lassen.
  if v_chat_id is null then
    insert into public.chats (session_id) values (new.session_id)
    returning id into v_chat_id;

    insert into public.chat_members (chat_id, user_id)
    values (v_chat_id, v_creator_id)
    on conflict do nothing;
  end if;

  -- Die Anfragende dazunehmen und den Beitritt ansagen.
  insert into public.chat_members (chat_id, user_id)
  values (v_chat_id, new.requester_id)
  on conflict do nothing;

  select coalesce(nullif(display_name, ''), 'Someone') into v_joiner_name
  from public.profiles where id = new.requester_id;

  insert into public.messages (chat_id, sender_id, body, kind)
  values (v_chat_id, new.requester_id, v_joiner_name || ' joined', 'system');

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

-- ------------------------------------------------------------------
-- 3. Backfill — fehlende Chats für zukünftige eigene Sessions
-- ------------------------------------------------------------------
-- Ohne diesen Nachtrag könnten alte Sessions ihre Anfragen nicht mehr verwalten, sobald
-- der Requests-Block aus der Detailseite verschwindet. Nur ZUKÜNFTIGE Sessions
-- (starts_at >= now()) ohne bestehenden Chat — vergangene sind überall gefiltert, und
-- getMyChats/getChatForSession gehen von ~1:1 aus, also keine Doppel-Chats anlegen.
with missing as (
  insert into public.chats (session_id)
  select s.id
  from public.sessions s
  where s.starts_at >= now()
    and not exists (select 1 from public.chats c where c.session_id = s.id)
  returning id as chat_id, session_id
)
insert into public.chat_members (chat_id, user_id)
select m.chat_id, s.creator_id
from missing m
join public.sessions s on s.id = m.session_id
on conflict do nothing;
