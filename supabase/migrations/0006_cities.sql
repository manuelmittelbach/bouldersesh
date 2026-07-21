-- City becomes an entity of its own. See docs/adr/0002-stadt-als-eigene-entitaet.md.
--
-- Until now the city was a nullable free-text column `gyms.city` (0001_initial.sql).
-- The feed needs to filter by city and the create flow picks city first, then gym —
-- both need a normalised, referenceable city.

-- ------------------------------------------------------------------
-- Cities
-- ------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Backfill from the existing free-text values
-- ------------------------------------------------------------------
-- Bail out if any gym has no city: `city_id` becomes NOT NULL right below, and
-- guessing a city would be worse than a loud failure. If this fires, fix the data
-- first, then run the migration again.
do $$
declare
  orphans text;
begin
  select string_agg(name, ', ')
    into orphans
    from public.gyms
   where city is null or btrim(city) = '';

  if orphans is not null then
    raise exception
      'Gyms without a city, migration aborted: %. Set gyms.city first.', orphans;
  end if;
end;
$$;

insert into public.cities (name)
select distinct btrim(city)
  from public.gyms
 where city is not null and btrim(city) <> ''
on conflict (name) do nothing;

alter table public.gyms add column city_id uuid references public.cities(id);

update public.gyms g
   set city_id = c.id
  from public.cities c
 where c.name = btrim(g.city);

alter table public.gyms alter column city_id set not null;

-- The feed joins sessions → gyms → cities and filters on city_id.
create index gyms_city_id_idx on public.gyms (city_id);

-- The old source of truth has to go, or the two drift apart.
alter table public.gyms drop column city;

-- ------------------------------------------------------------------
-- Cities — public read, write disabled (curated, like gyms)
-- ------------------------------------------------------------------
-- Deliberately mirrors the gyms policy in 0002_rls.sql: `using (true)` with no role
-- restriction, so anon can populate the city picker too.
alter table public.cities enable row level security;

create policy "cities readable by anyone"
  on public.cities for select
  using (true);

-- Inserts/updates restricted to service role (i.e. Supabase dashboard / admin script).
-- No client-side policies → mutations fail unless using service role key.
