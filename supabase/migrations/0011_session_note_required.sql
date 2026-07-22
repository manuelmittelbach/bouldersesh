-- Kletter-Niveau umbauen. Siehe docs/adr/0005-kletter-niveau-personen-band-statt-session-grade.md.
--
-- Der strukturierte Session-Grade (`sessions.level`, „6a" etc.) entfällt: Boulderer
-- denken in den Farb-Circuits ihrer Halle, nicht in Fb-Graden, und ein universeller
-- Grade ist über Hallen hinweg ohnehin nicht bedeutungsgleich. Was jemand klettern
-- will, steht künftig in der Session-Notiz — die dafür zur Pflicht wird.

-- ------------------------------------------------------------------
-- sessions.level entfällt
-- ------------------------------------------------------------------
alter table public.sessions
  drop column level;

-- ------------------------------------------------------------------
-- sessions.note wird Pflicht (nicht-leer)
-- ------------------------------------------------------------------
-- Zum Zeitpunkt der Migration existieren 2 Sessions, beide mit Notiz — kein Backfill.
alter table public.sessions
  alter column note set not null;

alter table public.sessions
  add constraint sessions_note_not_blank check (btrim(note) <> '');
