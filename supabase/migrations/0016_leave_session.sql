-- Leave a group session (ADR-0007 follow-up)
--
-- Bisher konnte eine aufgenommene Person eine fremde Session nur „ausblenden"
-- (chat_members.hidden_at) — sie blieb Mitglied, ihre Anfrage blieb `accepted`,
-- der belegte Platz blieb belegt. Das war irreführend. `leave_session` ist der
-- echte Austritt: er räumt die Mitgliedschaft ab, gibt den Platz frei und sagt
-- den Austritt im Chat an. Das Gegenstück zum Auflösen (die Ersteller:in löscht
-- die ganze Session, useDeleteSession) — hier verlässt nur EINE Person.
--
-- SECURITY DEFINER, weil eine:r Aufgenommene:r unter RLS die eigene
-- chat_members-Zeile nicht löschen, die Session nicht ändern und keine
-- System-Zeile schreiben darf. Spiegelbild zu handle_match_accepted (0014).

create or replace function public.leave_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_chat_id uuid;
  v_creator_id uuid;
  v_capacity int;
  v_accepted_count int;
  v_name text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select creator_id, capacity into v_creator_id, v_capacity
  from public.sessions where id = p_session_id;

  if v_creator_id is null then
    raise exception 'Session not found';
  end if;

  -- Die Ersteller:in verlässt nicht — sie löst auf (useDeleteSession). Riegel gegen
  -- einen Austritt über die falsche Rolle; ihr Platz ist konstruktiv immer belegt.
  if v_creator_id = v_user then
    raise exception 'The host cannot leave their own session';
  end if;

  -- Nur wer wirklich aufgenommen wurde, tritt aus. `found` ist nach dem UPDATE true,
  -- wenn genau die eigene angenommene Anfrage getroffen wurde. Die Zeile bleibt (auf
  -- `cancelled`) stehen: dank unique(session_id, requester_id) hebt useCreateMatchRequest
  -- sie später per Upsert wieder auf `pending` — Wiedereintritt ist möglich (ADR-0006).
  update public.match_requests
    set status = 'cancelled'
    where session_id = p_session_id
      and requester_id = v_user
      and status = 'accepted';

  if not found then
    raise exception 'You are not a member of this session';
  end if;

  -- Aus dem Gruppenchat entfernen und den Austritt ansagen (Gegenstück zu „X joined").
  select id into v_chat_id
  from public.chats where session_id = p_session_id
  limit 1;

  if v_chat_id is not null then
    select coalesce(nullif(display_name, ''), 'Someone') into v_name
    from public.profiles where id = v_user;

    insert into public.messages (chat_id, sender_id, body, kind)
    values (v_chat_id, v_user, v_name || ' left', 'system');

    delete from public.chat_members
      where chat_id = v_chat_id and user_id = v_user;
  end if;

  -- Platz frei: war die Session voll (matched) und sind jetzt wieder weniger als
  -- `capacity - 1` Anfragen angenommen (die Ersteller:in hält den ersten Platz),
  -- kippt sie zurück auf `open` — der frei gewordene Platz ist wieder buchbar.
  select count(*) into v_accepted_count
  from public.match_requests
  where session_id = p_session_id and status = 'accepted';

  if v_accepted_count < v_capacity - 1 then
    update public.sessions
      set status = 'open'
      where id = p_session_id and status = 'matched';
  end if;
end;
$$;

-- Nur eingeloggte Clients dürfen austreten; die Funktion prüft die Mitgliedschaft selbst.
-- `anon` explizit mit-entziehen: Supabase erteilt neuen public-Funktionen per Default-
-- Privileg direkt an anon/authenticated EXECUTE — ein `revoke … from public` allein
-- lässt den direkten anon-Grant stehen (Advisor-Lint 0028). Die Funktion no-op't zwar
-- für anon (auth.uid() null → Exception), aber wir schließen den Pfad sauber zu.
revoke all on function public.leave_session(uuid) from public, anon;
grant execute on function public.leave_session(uuid) to authenticated;
