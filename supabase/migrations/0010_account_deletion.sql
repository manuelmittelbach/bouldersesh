-- Account-Löschung, Schema-Teil. Siehe docs/adr/0004-account-loeschen.md.
--
-- Gelöscht wird endgültig; die vorhandenen FK-Cascades räumen Profil, Sessions und
-- Anfragen ab. Genau eine Stelle darf das *nicht* tun: die Nachrichten.

-- ------------------------------------------------------------------
-- messages.sender_id — cascade wird set null
-- ------------------------------------------------------------------
-- Der Chat ist auch die Aufzeichnung des Gegenübers. Löschte der Cascade die
-- Nachrichten mit, bliebe dort ein lückenhafter Verlauf, in dem es mit sich selbst
-- zu reden scheint (ADR-0004). Also bleibt die Nachricht und verliert nur ihre
-- Absender:in — als „Deleted user" gerendert.
alter table public.messages
  alter column sender_id drop not null;

alter table public.messages
  drop constraint messages_sender_id_fkey;

alter table public.messages
  add constraint messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete set null;

comment on column public.messages.sender_id is
  'NULL = Absender:in hat ihren Account gelöscht. Die Nachricht bleibt, siehe ADR-0004.';

-- Die Insert-Policy aus 0002_rls.sql (`sender_id = auth.uid()`) bleibt unverändert
-- gültig: NULL = auth.uid() ergibt NULL, der WITH CHECK schlägt fehl. Niemand kann
-- also eine absenderlose Nachricht *schreiben* — sie kann nur eine werden.
