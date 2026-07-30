-- Nur den Gruppenchat verlassen (Gegenstück zu leave_session, 0016)
--
-- Sobald eine Session vom Feed gefallen ist (>1h nach `starts_at`), ergibt „Absagen"
-- keinen Sinn mehr — der Plan ist gelaufen, und ein Delete würde nur einen Chat
-- zerstören, den die Runde evtl. noch nutzt. Ab da bietet die UI statt Delete/Leave
-- session nur noch „Leave chat": man geht still aus dem Chat, für die anderen bleibt
-- alles stehen (bis die Chat-Retention 0019 ihn ohnehin wegräumt).
--
-- Anders als `leave_session` (0016): KEINE Platz-Neurechnung, KEINE Änderung an
-- match_requests, KEIN Session-Delete. Reiner Chat-Austritt — und deshalb auch für die
-- ERSTELLER:IN erlaubt (die leave_session bewusst verbietet). Die Zeile verschwindet
-- clientseitig aus Hosting/Joined, weil beide Sektionen an die Chat-Mitgliedschaft
-- (useMyChats) gekoppelt sind; die entfernte chat_members-Zeile zieht sie dort raus.
--
-- SECURITY DEFINER wie 0016: unter RLS dürfte man die eigene chat_members-Zeile nicht
-- löschen und keine System-Zeile schreiben. Die Funktion prüft die Mitgliedschaft selbst.

create or replace function public.leave_chat(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_chat_id uuid;
  v_name text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_chat_id
  from public.chats where session_id = p_session_id
  limit 1;

  if v_chat_id is null then
    raise exception 'Chat not found';
  end if;

  -- Mitglied sein (Host ODER Aufgenommene:r) — sonst gibt es nichts zu verlassen.
  if not exists (
    select 1 from public.chat_members
    where chat_id = v_chat_id and user_id = v_user
  ) then
    raise exception 'You are not a member of this chat';
  end if;

  -- Austritt ansagen (Gegenstück zu „X joined"/„X left" aus 0016/0017), dann raus.
  select coalesce(nullif(display_name, ''), 'Someone') into v_name
  from public.profiles where id = v_user;

  insert into public.messages (chat_id, sender_id, body, kind)
  values (v_chat_id, v_user, v_name || ' left', 'system');

  delete from public.chat_members
    where chat_id = v_chat_id and user_id = v_user;
end;
$$;

-- Wie 0016: `anon` explizit mit-entziehen (Advisor-Lint 0028 — der Default-Grant an
-- anon/authenticated bliebe sonst stehen), Ausführung nur für eingeloggte Clients.
revoke all on function public.leave_chat(uuid) from public, anon;
grant execute on function public.leave_chat(uuid) to authenticated;
