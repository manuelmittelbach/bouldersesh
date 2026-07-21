-- Vollständige Hallenliste für Berlin und München (Stand Juli 2026).
--
-- Aufgenommen sind reine Boulderhallen und Kletterhallen mit eigenem Boulderbereich,
-- jeweils nur im Stadtgebiet. Umlandhallen (Boulderwelt Süd/Brunnthal, DAV Gilching,
-- Blockzone/Potsdam, Holland-Park/Panketal ...) bleiben draußen, solange es für ihre
-- Städte keine Einträge in `cities` gibt.
--
-- Nicht aufgenommen: reine Seilkletter-/Fun-Anlagen ohne Boulderbereich
-- (KletterMax, BergWerk, MAXX Arena) und dauerhaft geschlossene Hallen
-- (Boulderworx Berlin, T-Hall Neukölln → heute South Rock Marienfelde).

-- Erlaubt das idempotente Nachladen weiter unten und verhindert, dass dieselbe
-- Halle künftig zweimal in einer Stadt landet.
create unique index if not exists gyms_name_city_id_key on public.gyms (name, city_id);

-- ------------------------------------------------------------------
-- Bestehende Einträge auf die kanonischen Namen ziehen
-- ------------------------------------------------------------------
-- Ohne das würden "ostbloc" und "Ostbloc" als zwei Hallen nebeneinander stehen.
-- Beim DAV-Zentrum kommt dazu, dass "DAV Kletter- und Boulderzentrum" nicht mehr
-- eindeutig ist, sobald Freimann daneben liegt — der Altbestand ist Thalkirchen.
update public.gyms g
   set name = v.new_name
  from (values
    ('ostbloc',                          'Berlin',   'Ostbloc'),
    ('urban apes Fhain',                 'Berlin',   'urban apes Fhain'),
    ('DAV Kletter- und Boulderzentrum',  'München',  'DAV Kletter- und Boulderzentrum München-Süd (Thalkirchen)')
  ) as v(old_name, city_name, new_name)
  join public.cities c on c.name = v.city_name
 where g.name = v.old_name
   and g.city_id = c.id;

-- ------------------------------------------------------------------
-- Berlin
-- ------------------------------------------------------------------
insert into public.gyms (name, address, city_id)
select v.name, v.address, c.id
  from public.cities c
  cross join (values
    ('Berta Block Boulderhalle',    'Mühlenstraße 62, 13187 Berlin'),
    ('Bouldergarten',               'Thiemannstraße 1, Tor 4, 12059 Berlin'),
    ('Boulderklub Kreuzberg',       'Ohlauer Str. 38, 10999 Berlin'),
    ('Ostbloc',                     'Hauptstraße 13, 10317 Berlin'),
    ('Südbloc',                     'Großbeerenstraße 2–10, Haus 4, 12107 Berlin'),
    ('Ninja Bloc',                  'Seelenbinderstraße 129–157, 12555 Berlin'),
    ('urban apes Fhain',            'Friedenstraße 91 B, 10249 Berlin'),
    ('urban apes Basement',         'Stresemannstraße 72, 10963 Berlin'),
    ('urban apes bright site',      'Wilhelm-Kabus-Straße 40, 10829 Berlin'),
    ('urban apes Wedding',          'Müllerstraße 46, 13349 Berlin'),
    ('ELEKTRA Boulderhalle',        'Gustav-Meyer-Allee 25, Gebäude 12, 13355 Berlin'),
    ('Cliffhanger Boulderlounge',   'Telegrafenweg 21, 13599 Berlin'),
    ('Der Kegel',                   'Revaler Str. 99, 10245 Berlin'),
    ('Magic Mountain',              'Böttgerstraße 20–26, 13357 Berlin'),
    ('South Rock',                  'Trachenbergring 85, 12249 Berlin'),
    -- Zutritt nur für DAV-Mitglieder.
    ('DAV Kletterzentrum Berlin',   'Seydlitzstraße 1H, 10557 Berlin')
  ) as v(name, address)
 where c.name = 'Berlin'
on conflict (name, city_id) do update set address = excluded.address;

-- ------------------------------------------------------------------
-- München
-- ------------------------------------------------------------------
insert into public.gyms (name, address, city_id)
select v.name, v.address, c.id
  from public.cities c
  cross join (values
    ('Boulderwelt München-Ost',                                    'Hanne-Hiob-Str. 4, 81671 München'),
    ('Boulderwelt München-West',                                   'Bertha-Kipfmüller-Str. 19, 81249 München'),
    ('Einstein Boulderhalle',                                      'Landsberger Str. 185, 80687 München'),
    ('ELEMENT Boulders München',                                   'Zielstattstr. 23, 81379 München'),
    -- Zwischennutzung Paketposthalle ("Pineapple Park") — Standort mittelfristig offen.
    ('The Boulder Room',                                           'Arnulfstr. 195, 80634 München'),
    ('Munich Action Park',                                         'Spiridon-Louis-Ring 3, 80809 München'),
    ('DAV Kletter- und Boulderzentrum München-Süd (Thalkirchen)',  'Thalkirchner Str. 207, 81371 München'),
    ('DAV Kletter- und Boulderzentrum München-Nord (Freimann)',    'Werner-Heisenberg-Allee 5, 80939 München'),
    ('Heavens Gate',                                               'Speicherstr. 21, 81671 München'),
    ('Kletter- und Boulderzentrum SVN Neuperlach',                 'Fritz-Erler-Str. 3, 81737 München'),
    ('Kletterhalle MTV München',                                   'Häberlstr. 11b, 80337 München'),
    -- Zutritt nur für Hochschulangehörige (ZHS / TUM Campus Olympiapark).
    ('ZHS Kletter- und Boulderhalle',                              'Connollystr. 32, 80809 München')
  ) as v(name, address)
 where c.name = 'München'
on conflict (name, city_id) do update set address = excluded.address;
