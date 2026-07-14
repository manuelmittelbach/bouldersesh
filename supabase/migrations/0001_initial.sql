-- Boulder Buddy — initial schema
-- Maps 1:1 to the data model in Boulder-Buddy_Konzept.md §4.
--
-- Run with the Supabase CLI:
--   supabase link --project-ref <ref>
--   supabase db push
--
-- Or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------------
create type skill_level as enum ('beginner', 'intermediate', 'advanced', 'pro');
create type session_visibility as enum ('public', 'friends');
create type session_status as enum ('open', 'matched', 'done', 'cancelled');
create type match_status as enum ('pending', 'accepted', 'declined', 'cancelled');

-- ------------------------------------------------------------------
-- Gyms
-- ------------------------------------------------------------------
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  address text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  skill_level skill_level,
  preferred_styles text[] default '{}',
  home_gym_id uuid references public.gyms(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------
-- Sessions
-- ------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  level text not null, -- free-form ("6a–6c") for now, can tighten to enum later
  note text,
  max_buddies int not null default 1 check (max_buddies between 1 and 8),
  visibility session_visibility not null default 'public',
  status session_status not null default 'open',
  created_at timestamptz not null default now()
);

-- Feed query (Konzept §4)
create index sessions_gym_starts_idx on public.sessions (gym_id, starts_at);
create index sessions_creator_idx on public.sessions (creator_id);
create index sessions_status_starts_idx on public.sessions (status, starts_at);

-- ------------------------------------------------------------------
-- Match requests
-- ------------------------------------------------------------------
create table public.match_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status match_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (session_id, requester_id) -- one request per (user, session)
);

create index match_requests_session_idx on public.match_requests (session_id);
create index match_requests_requester_idx on public.match_requests (requester_id);

-- ------------------------------------------------------------------
-- Chats + members + messages
-- ------------------------------------------------------------------
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.chat_members (
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (chat_id, user_id)
);

create index chat_members_user_idx on public.chat_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  sent_at timestamptz not null default now()
);

-- Chat history query (Konzept §4)
create index messages_chat_sent_idx on public.messages (chat_id, sent_at);

-- ------------------------------------------------------------------
-- On match acceptance: auto-create chat + add both users as members
-- ------------------------------------------------------------------
create or replace function public.handle_match_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
  v_creator_id uuid;
begin
  if new.status <> 'accepted' or old.status = 'accepted' then
    return new;
  end if;

  select creator_id into v_creator_id
  from public.sessions where id = new.session_id;

  insert into public.chats (session_id) values (new.session_id)
  returning id into v_chat_id;

  insert into public.chat_members (chat_id, user_id) values
    (v_chat_id, v_creator_id),
    (v_chat_id, new.requester_id);

  -- Flip session to matched (still simple MVP: first accept wins).
  update public.sessions set status = 'matched' where id = new.session_id;

  return new;
end;
$$;

create trigger on_match_accepted
  after update on public.match_requests
  for each row execute function public.handle_match_accepted();
