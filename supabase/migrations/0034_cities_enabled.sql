-- Launch scoping: ship Berlin first, keep Munich's data but hide it until we flip it on.
-- The client (useCities / useActiveCity) only ever shows and resolves cities where
-- enabled = true, so enabling Munich later is a single UPDATE — no app release, no
-- App Review cycle, existing installs pick it up on their next cities refresh:
--
--   update public.cities set enabled = true where name = 'Munich';

alter table public.cities
  add column if not exists enabled boolean not null default true;

update public.cities set enabled = false where name = 'Munich';
