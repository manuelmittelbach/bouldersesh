-- Public feed: let logged-out visitors browse open public sessions.
--
-- The MVP RLS (0002) restricted every read to the `authenticated` role, so the
-- feed was empty for guests. Here we open up exactly the reads the public
-- dashboard needs — nothing more. Writes/actions stay gated to authenticated.

-- ------------------------------------------------------------------
-- Sessions — anon may read public sessions only
-- ------------------------------------------------------------------
create policy "sessions public readable by anon"
  on public.sessions for select
  to anon
  using (visibility = 'public');

-- ------------------------------------------------------------------
-- Profiles — anon may read only the profiles that created a public session
-- (needed for the creator name/level/avatar shown on each feed card).
-- Tighter than blanket public access: profiles of users who never posted a
-- public session stay private to anonymous visitors.
-- ------------------------------------------------------------------
create policy "profiles of public session creators readable by anon"
  on public.profiles for select
  to anon
  using (
    id in (select creator_id from public.sessions where visibility = 'public')
  );

-- gyms are already world-readable (policy "gyms readable by anyone" in 0002,
-- which uses `using (true)` with no role restriction → includes anon).
