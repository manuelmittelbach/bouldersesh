-- Zwei Eigenschaften, die sich am Halleneintrag kreuzen und deshalb getrennt bleiben:
-- `active` filtert (Halle raus aus der Auswahl), `access` informiert (Halle bleibt,
-- mit Hinweis). Eine DAV-Halle kann gleichzeitig zugangsbeschränkt und geschlossen
-- sein — in einem gemeinsamen Enum ließe sich das nicht darstellen.

-- ------------------------------------------------------------------
-- active — Soft Delete
-- ------------------------------------------------------------------
-- Schließt eine Halle (Boulderworx Berlin, 2025), kann ihre Zeile nicht gelöscht
-- werden: an ihr hängen Sessions über `sessions.gym_id`. Die Session vom letzten
-- März war echt, die Halle gab es damals. Also aus der Auswahl nehmen statt löschen.
alter table public.gyms
  add column active boolean not null default true;

-- ------------------------------------------------------------------
-- access — wer darf rein
-- ------------------------------------------------------------------
-- null = offen für alle. Die Halle bleibt in jedem Fall wählbar; das Label soll nur
-- verhindern, dass sich jemand zu einer Session verabredet, zu der er keinen Zutritt
-- hat. Als text + Check statt enum, weil sich ein Check billiger erweitern lässt.
alter table public.gyms
  add column access text
    check (access in ('members_only', 'students_only'));

comment on column public.gyms.access is
  'null = offen für alle; members_only = Vereinsmitglieder (DAV); students_only = Hochschulangehörige';

update public.gyms g
   set access = v.access
  from (values
    ('DAV Kletterzentrum Berlin',     'Berlin',   'members_only'),
    ('ZHS Kletter- und Boulderhalle', 'München',  'students_only')
  ) as v(gym_name, city_name, access)
  join public.cities c on c.name = v.city_name
 where g.name = v.gym_name
   and g.city_id = c.id;

-- Jede Hallenabfrage filtert auf active; der Teilindex hält den Filter billig,
-- ohne die inaktiven Zeilen mitzuschleppen.
create index gyms_active_city_id_idx
  on public.gyms (city_id)
  where active;
