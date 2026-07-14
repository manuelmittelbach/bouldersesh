-- Row-Level Security for Boulder Buddy.
--
-- Principle: deny by default, then open up exactly what the MVP needs.
-- Re-read these every time you add a feature — RLS is the entire security model.

-- ------------------------------------------------------------------
-- Gyms — public read, write disabled in MVP
-- ------------------------------------------------------------------
alter table public.gyms enable row level security;

create policy "gyms readable by anyone"
  on public.gyms for select
  using (true);

-- Inserts/updates restricted to service role (i.e. Supabase dashboard / admin script).
-- No client-side policies → mutations fail unless using service role key.

-- ------------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Authenticated users see all profiles (so they can see who created a session).
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Only the owner can update / insert their profile row.
create policy "profile insert self"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profile update self"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------------
-- Sessions
-- ------------------------------------------------------------------
alter table public.sessions enable row level security;

-- Public sessions visible to all authenticated users.
-- (Friends-only sessions handled in Phase 2 alongside friendships table.)
create policy "sessions public readable"
  on public.sessions for select
  to authenticated
  using (visibility = 'public');

-- Creator can always see their own session, regardless of visibility.
create policy "sessions own readable"
  on public.sessions for select
  to authenticated
  using (creator_id = auth.uid());

-- Only authenticated users can create sessions, only as themselves.
create policy "session insert self"
  on public.sessions for insert
  to authenticated
  with check (creator_id = auth.uid());

-- Only the creator can update or delete their own session.
create policy "session update own"
  on public.sessions for update
  to authenticated
  using (creator_id = auth.uid())
  with check (creator_id = auth.uid());

create policy "session delete own"
  on public.sessions for delete
  to authenticated
  using (creator_id = auth.uid());

-- ------------------------------------------------------------------
-- Match requests
-- ------------------------------------------------------------------
alter table public.match_requests enable row level security;

-- Requester sees their own requests; session creator sees requests on their sessions.
create policy "match requests readable to parties"
  on public.match_requests for select
  to authenticated
  using (
    requester_id = auth.uid()
    or session_id in (select id from public.sessions where creator_id = auth.uid())
  );

-- Anyone authenticated can request to join a public session that isn't theirs.
create policy "match request insert"
  on public.match_requests for insert
  to authenticated
  with check (
    requester_id = auth.uid()
    and session_id in (
      select id from public.sessions
      where visibility = 'public' and creator_id <> auth.uid()
    )
  );

-- Session creator can update (accept/decline) requests on their session;
-- requester can cancel their own.
create policy "match request update by parties"
  on public.match_requests for update
  to authenticated
  using (
    requester_id = auth.uid()
    or session_id in (select id from public.sessions where creator_id = auth.uid())
  )
  with check (
    requester_id = auth.uid()
    or session_id in (select id from public.sessions where creator_id = auth.uid())
  );

-- ------------------------------------------------------------------
-- Chats / chat_members / messages
-- ------------------------------------------------------------------
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

-- A chat is visible to its members.
create policy "chat readable to member"
  on public.chats for select
  to authenticated
  using (
    id in (select chat_id from public.chat_members where user_id = auth.uid())
  );

-- chat_members: you see rows for chats you're in.
create policy "chat_members readable to member"
  on public.chat_members for select
  to authenticated
  using (
    chat_id in (select chat_id from public.chat_members where user_id = auth.uid())
  );

-- Updating last_read_at is allowed for your own row.
create policy "chat_members update own"
  on public.chat_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Messages: members of the chat can read.
create policy "messages readable to chat members"
  on public.messages for select
  to authenticated
  using (
    chat_id in (select chat_id from public.chat_members where user_id = auth.uid())
  );

-- Members of the chat can post; sender must be self.
create policy "messages insert as self in chat"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and chat_id in (select chat_id from public.chat_members where user_id = auth.uid())
  );

-- No updates / deletes on messages in MVP.
