-- Optional seed data for local development.
-- Run with `supabase db reset` (which executes migrations + this file) or paste into the SQL editor.
--
-- Idempotent by hand: `cities.name` is unique, so `on conflict` works there.
-- `gyms` has NO unique constraint on the name and its ids come from
-- gen_random_uuid() — `on conflict do nothing` would be a no-op and would add
-- duplicates on every run. Hence the explicit `where not exists` guard.

-- ------------------------------------------------------------------
-- Cities
-- ------------------------------------------------------------------
insert into public.cities (name) values
  ('München'),
  ('Berlin')
on conflict (name) do nothing;

-- ------------------------------------------------------------------
-- Gyms
-- ------------------------------------------------------------------
insert into public.gyms (name, city_id, address)
select v.name, c.id, v.address
  from (values
    -- München
    ('Boulderwelt München-Ost',         'München', 'Friedenstraße 10, 81671 München'),
    ('Boulderwelt München-West',        'München', 'Hans-Preißinger-Straße 14, 81379 München'),
    ('Einstein Boulderhalle',           'München', 'Hans-Preißinger-Straße 24, 81379 München'),
    ('DAV Kletter- und Boulderzentrum', 'München', 'Thalkirchner Str. 207, 81371 München'),
    -- Berlin. Names use each gym's own spelling (ostbloc/urban apes lowercase).
    ('Berta Block Boulderhalle',        'Berlin',  'Mühlenstraße 62, 13187 Berlin'),
    ('Bouldergarten',                   'Berlin',  'Thiemannstraße 1, 12059 Berlin'),
    ('Boulderklub Kreuzberg',           'Berlin',  'Ohlauer Str. 38, 10999 Berlin'),
    ('ostbloc',                         'Berlin',  'Hauptstraße 13, 10317 Berlin'),
    -- Postcode 10249 comes from a third-party source only (kletterszene.com);
    -- street and number are backed by the operator's own press release.
    ('urban apes Fhain',                'Berlin',  'Friedenstraße 91 B, 10249 Berlin')
  ) as v(name, city_name, address)
  join public.cities c on c.name = v.city_name
 where not exists (
   select 1 from public.gyms g where g.name = v.name
 );
