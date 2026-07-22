-- Profilbilder. Siehe docs/adr/0003-profilbilder-oeffentlicher-bucket-pfade-in-der-db.md.
--
-- In der DB stehen **Storage-Pfade**, keine URLs — die öffentliche URL baut der Client
-- per `getPublicUrl()`. Damit ist ein späterer Umstieg auf signierte URLs eine
-- Code-Änderung statt einer Datenmigration.

-- ------------------------------------------------------------------
-- Avatar
-- ------------------------------------------------------------------
-- `avatar_url` (0001_initial.sql) wurde nie befüllt — die Spalte ist in jeder Zeile
-- NULL, ein Rename ist also schmerzfrei. Der neue Name sagt, was drinsteht:
-- `{user_id}/{zufall}.jpg`, nicht `https://…`.
alter table public.profiles
  rename column avatar_url to avatar_path;

comment on column public.profiles.avatar_path is
  'Storage-Pfad im Bucket profile-images, Form {user_id}/{zufall}.jpg. Keine URL.';

-- ------------------------------------------------------------------
-- Galerie
-- ------------------------------------------------------------------
-- Als Array statt eigener Tabelle: max. 6 Bilder ohne Eigenschaften pro Bild.
-- `preferred_styles text[]` ist der Präzedenzfall im Schema (ADR-0003).
-- Die Reihenfolge im Array ist die Anzeigereihenfolge — umsortieren gibt es nicht,
-- Neues hängt hinten an.
alter table public.profiles
  add column gallery_paths text[] not null default '{}';

-- array_length liefert bei leerem Array NULL, deshalb coalesce — sonst wäre die
-- Bedingung „unbekannt" und der Check würde still durchgehen.
-- Der zweite Teil hält NULL-Einträge draußen: ein Loch im Array wäre ein Pfad,
-- den niemand mehr löschen kann.
alter table public.profiles
  add constraint profiles_gallery_paths_check
    check (
      coalesce(array_length(gallery_paths, 1), 0) <= 6
      and array_position(gallery_paths, null) is null
    );

comment on column public.profiles.gallery_paths is
  'Bis zu 6 Storage-Pfade im Bucket profile-images. Array-Reihenfolge = Anzeigereihenfolge.';

-- ------------------------------------------------------------------
-- Meldungen
-- ------------------------------------------------------------------
-- Eine Meldung entfernt nichts (CONTEXT.md) — sie legt einen Vorgang an, über den
-- ein Mensch im Dashboard entscheidet. Kein Auto-Filter, keine Sichtbarkeitsfolge.
create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  -- Löscht die meldende Person ihren Account, bleibt die Meldung stehen: sie ist
  -- eine Aussage über die *gemeldete* Person, und die ist noch da.
  reporter_id uuid references public.profiles(id) on delete set null,
  -- Ist die gemeldete Person weg, ist die Meldung gegenstandslos.
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (reason is null or length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  -- Von Hand im Dashboard gesetzt, sobald jemand hingesehen hat.
  handled_at timestamptz,
  constraint profile_reports_not_self check (reporter_id is null or reporter_id <> reported_id),
  -- Zweimal dieselbe Person melden ändert nichts — der Client muss den
  -- Unique-Verstoß als „schon gemeldet" lesen, nicht als Fehler.
  unique (reporter_id, reported_id)
);

create index profile_reports_open_idx
  on public.profile_reports (created_at)
  where handled_at is null;

alter table public.profile_reports enable row level security;

-- Melden darf man nur in eigenem Namen.
create policy "report insert as self"
  on public.profile_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Die eigenen Meldungen darf man sehen (damit die UI „schon gemeldet" zeigen kann),
-- fremde nicht. Bearbeitet wird ausschließlich per service_role im Dashboard.
create policy "reports readable to reporter"
  on public.profile_reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- ------------------------------------------------------------------
-- Storage-Bucket
-- ------------------------------------------------------------------
-- Öffentlich: `profiles` ist per RLS ohnehin für alle Eingeloggten lesbar
-- (0002_rls.sql:24), ein strengerer Schutz auf den Bildern wäre Theater (ADR-0003).
-- Größen- und MIME-Grenze auf Bucket-Ebene, damit sie auch dann greift, wenn der
-- Client sie umgeht — hochgeladen wird ausschließlich clientseitig erzeugtes JPEG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Lesen für alle, auch ohne Account: bei einem öffentlichen Bucket geht der
-- GET am RLS vorbei — die Policy hier macht nur zusätzlich das Auflisten möglich
-- und hält die Absicht an einer Stelle sichtbar.
create policy "profile images readable by anyone"
  on storage.objects for select
  using (bucket_id = 'profile-images');

-- Schreiben nur im eigenen Ordner. Der erste Pfadabschnitt ist die user_id;
-- alles darunter darf die Person frei benennen (der Client würfelt pro Upload
-- einen neuen Namen, damit kein Cache-Buster nötig wird).
create policy "profile images insert own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "profile images update own folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Löschen braucht die App für zwei Fälle: das alte File nach einem Wechsel und
-- das einzelne Galeriefoto. Der Account-Löschweg räumt dagegen per service_role
-- auf (ADR-0004) — der kommt hier gar nicht vorbei.
create policy "profile images delete own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
