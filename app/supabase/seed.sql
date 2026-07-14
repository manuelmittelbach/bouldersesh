-- Optional seed data for local development.
-- Run with `supabase db reset` (which executes migrations + this file) or paste into the SQL editor.

insert into public.gyms (id, name, city, address) values
  (gen_random_uuid(), 'Boulderwelt München-Ost', 'München', 'Friedenstraße 10, 81671 München'),
  (gen_random_uuid(), 'Boulderwelt München-West', 'München', 'Hans-Preißinger-Straße 14, 81379 München'),
  (gen_random_uuid(), 'Einstein Boulderhalle',   'München', 'Hans-Preißinger-Straße 24, 81379 München'),
  (gen_random_uuid(), 'DAV Kletter- und Boulderzentrum', 'München', 'Thalkirchner Str. 207, 81371 München')
on conflict do nothing;
