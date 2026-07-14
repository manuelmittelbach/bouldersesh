-- Fix: "infinite recursion detected in policy for relation chat_members".
--
-- The old chat_members SELECT policy referenced chat_members inside its own
-- USING clause. Evaluating that subquery re-applies the very same policy →
-- infinite recursion. Because the chats/messages policies also read
-- chat_members, the recursion took the whole chat feature down.
--
-- Standard Supabase fix: move the membership check into a SECURITY DEFINER
-- function. It runs as the function owner and therefore bypasses RLS on the
-- inner read, so there is no policy re-entry and no recursion.

create or replace function public.is_chat_member(_chat_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.chat_members
    where chat_id = _chat_id
      and user_id = auth.uid()
  );
$$;

-- Lock the function down: callable by clients, but no one can shadow it.
revoke all on function public.is_chat_member(uuid) from public;
grant execute on function public.is_chat_member(uuid) to authenticated;

-- ------------------------------------------------------------------
-- Re-create the affected policies using the helper (no self-reference).
-- ------------------------------------------------------------------

drop policy if exists "chat readable to member" on public.chats;
create policy "chat readable to member"
  on public.chats for select
  to authenticated
  using ( public.is_chat_member(id) );

drop policy if exists "chat_members readable to member" on public.chat_members;
create policy "chat_members readable to member"
  on public.chat_members for select
  to authenticated
  using ( public.is_chat_member(chat_id) );

drop policy if exists "messages readable to chat members" on public.messages;
create policy "messages readable to chat members"
  on public.messages for select
  to authenticated
  using ( public.is_chat_member(chat_id) );

drop policy if exists "messages insert as self in chat" on public.messages;
create policy "messages insert as self in chat"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
  );
