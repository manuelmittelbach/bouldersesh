-- sessions.note wird wieder optional. Kehrt den Pflicht-Teil von 0011 um.
-- Siehe docs/adr/0005-kletter-niveau-personen-band-statt-session-grade.md (aktualisiert).
--
-- 0011 machte die Notiz zur Pflicht (NOT NULL + nicht-leer), damit „was ich klettern
-- will" garantiert an der Session steht. In der Praxis ist die Notiz aber ein reines
-- Kontext-Signal, kein Filter — Halle + Zeit reichen zum Verabreden. Der Zwang bremst
-- genau die Leute, die nur schnell „los geht's" wollen. Die Notiz bleibt sichtbar
-- angeboten (Create-Screen: „Optional, but it helps people decide."), aber freiwillig.
--
-- `level` bleibt entfernt (0011) — nur die note-Pflicht wird zurückgenommen.

alter table public.sessions
  drop constraint if exists sessions_note_not_blank;

alter table public.sessions
  alter column note drop not null;
