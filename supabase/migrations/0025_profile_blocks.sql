-- Blocken (App-Store-Pflicht 1.2 + reale Sicherheit): der persönliche, stille,
-- SOFORT wirkende Schutz — im Gegensatz zu profile_reports (0009), das reine
-- Buchführung für die Moderation ist und nichts an der App ändert. Blocken kappt
-- Sichtbarkeit UND Kontakt. Richtung blocker→blocked, WIRKUNG symmetrisch: danach
-- sehen sich beide nicht mehr und können nicht mehr gemeinsam klettern.
--
-- Schließt die zwei Löcher, die „Chat verlassen" + „Anfrage verweigern" offen lassen:
--   1. Die geblockte Person joint eine FREMDE Session, in der ich schon drin bin.
--   2. Sie sieht im Feed, wo ich sein werde.
-- (1) verhindert der match_requests-Guard unten (nicht nur gegen den Host, auch gegen
-- bereits akzeptierte Mitglieder); (2) der Client-Filter über my_block_ids().

create table public.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  -- Beide Seiten on delete cascade: ein Block ist gegenstandslos, sobald eine der
  -- beiden Personen weg ist (anders als profile_reports, wo die Meldung eine Aussage
  -- über die gemeldete Person bleibt).
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_blocks_not_self check (blocker_id <> blocked_id),
  -- Zweimal blocken ist idempotent — der Client liest den Unique-Verstoß als „schon
  -- geblockt", nicht als Fehler (wie bei profile_reports).
  unique (blocker_id, blocked_id)
);

-- Für is_blocked_between / my_block_ids: die Rückrichtung (wer hat MICH geblockt)
-- läuft über blocked_id.
create index profile_blocks_blocked_idx on public.profile_blocks (blocked_id);

alter table public.profile_blocks enable row level security;

-- Blocken nur in eigenem Namen.
create policy "block insert as self"
  on public.profile_blocks for insert
  to authenticated
  with check (blocker_id = auth.uid());

-- Lesbar sind NUR meine eigenen (ausgehenden) Blocks — für die „Blocked climbers"-
-- Liste und den Button-Zustand. Wer MICH geblockt hat, bleibt verborgen, sonst wäre
-- der Block nicht mehr still (die Gegenseite dürfte es nicht erfahren).
create policy "block select own"
  on public.profile_blocks for select
  to authenticated
  using (blocker_id = auth.uid());

-- Entblocken (nur die eigenen).
create policy "block delete own"
  on public.profile_blocks for delete
  to authenticated
  using (blocker_id = auth.uid());

-- ------------------------------------------------------------------
-- my_block_ids() — die zentrale Zutat für den Client-Filter
-- ------------------------------------------------------------------
-- Gibt die flache Liste der Gegenparteien zurück (BEIDE Richtungen zusammen), ohne zu
-- verraten wer wen geblockt hat. SECURITY DEFINER, weil die RLS mir die Zeilen, in
-- denen ICH die geblockte Person bin (blocked_id = auth.uid()), bewusst NICHT zeigt —
-- die brauche ich aber fürs symmetrische Ausblenden. Der Client bekommt so eine reine
-- „unsichtbar"-ID-Menge, ohne die Blocks fremder Leute im Klartext zu sehen.
create or replace function public.my_block_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select blocked_id from public.profile_blocks where blocker_id = auth.uid()
  union
  select blocker_id from public.profile_blocks where blocked_id = auth.uid()
$$;

revoke all on function public.my_block_ids() from public, anon;
grant execute on function public.my_block_ids() to authenticated;

-- ------------------------------------------------------------------
-- is_blocked_between(a, b) — interner Prädikat-Helfer (Guard/RPC)
-- ------------------------------------------------------------------
-- SECURITY DEFINER, damit er unabhängig von der aufrufenden RLS die ganze Tabelle
-- sieht. Wird nur aus anderen SECURITY-DEFINER-Funktionen/Triggern (Owner-Kontext)
-- aufgerufen — deshalb KEIN grant an authenticated: Clients brauchen ihn nicht.
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profile_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

revoke all on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Guard auf match_requests — verhindert NEUEN Kontakt
-- ------------------------------------------------------------------
-- Der eigentliche Sicherheitsriegel: wird eine Anfrage pending/accepted, wird sie
-- abgelehnt, falls ein Block besteht zwischen dem/der Anfragenden und (a) dem Host der
-- Session ODER (b) einem bereits akzeptierten Mitglied. (b) schließt Loch #1: die
-- geblockte Person kann keine fremde Session joinen, in der ich schon drin bin — und
-- umgekehrt. Greift auf INSERT (neue Anfrage) UND UPDATE (der Accept-Übergang), damit
-- nicht zwei gleichzeitig pending Anfragen durchschlüpfen. SECURITY DEFINER, damit die
-- Mitglieder-Prüfung nicht an der RLS des/der Anfragenden hängt.
create or replace function public.match_requests_block_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
begin
  -- Nur relevant, wenn die Zeile aktiv wird. cancelled/declined ziehen sich zurück und
  -- dürfen immer durch (u. a. setzt block_profile selbst auf diese Status).
  if new.status not in ('pending', 'accepted') then
    return new;
  end if;

  select creator_id into v_creator from public.sessions where id = new.session_id;

  if v_creator is not null
     and public.is_blocked_between(new.requester_id, v_creator) then
    raise exception 'Blocked: cannot request this session'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.match_requests m
    where m.session_id = new.session_id
      and m.status = 'accepted'
      and m.requester_id <> new.requester_id
      and public.is_blocked_between(new.requester_id, m.requester_id)
  ) then
    raise exception 'Blocked: a climber in this session is blocked'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- Trigger-Funktion ist nicht direkt aufrufbar, aber wir ziehen den Default-Grant
-- konsequent mit ab (Advisor-Lint 0028), wie bei jeder anderen Funktion hier.
revoke all on function public.match_requests_block_guard() from public, anon, authenticated;

create trigger match_requests_block_guard
  before insert or update on public.match_requests
  for each row execute function public.match_requests_block_guard();

-- ------------------------------------------------------------------
-- _eject_from_session(session, user) — interner Austritts-Helfer
-- ------------------------------------------------------------------
-- Spiegelt den Kern von leave_session (0016), aber für eine BELIEBIGE Person (nicht nur
-- auth.uid()): Anfrage auf cancelled, Chat-Mitgliedschaft weg samt „X left"-Systemzeile,
-- und ein frei gewordener Platz kippt die Session zurück auf `open`. Wird nur intern aus
-- block_profile (Owner-Kontext) gerufen — kein Client-Grant.
create or replace function public._eject_from_session(p_session_id uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chat_id uuid;
  v_name text;
  v_capacity int;
  v_accepted int;
begin
  update public.match_requests
    set status = 'cancelled'
    where session_id = p_session_id
      and requester_id = p_user
      and status in ('pending', 'accepted');

  select id into v_chat_id
  from public.chats where session_id = p_session_id
  limit 1;

  if v_chat_id is not null and exists (
    select 1 from public.chat_members
    where chat_id = v_chat_id and user_id = p_user
  ) then
    select coalesce(nullif(display_name, ''), 'Someone') into v_name
    from public.profiles where id = p_user;

    insert into public.messages (chat_id, sender_id, body, kind)
    values (v_chat_id, p_user, v_name || ' left', 'system');

    delete from public.chat_members
      where chat_id = v_chat_id and user_id = p_user;
  end if;

  -- Platz frei → zurück auf `open` (wortgleich zu leave_session: die Ersteller:in hält
  -- den ersten Platz, deshalb capacity - 1).
  select capacity into v_capacity from public.sessions where id = p_session_id;
  select count(*) into v_accepted
  from public.match_requests
  where session_id = p_session_id and status = 'accepted';

  if v_capacity is not null and v_accepted < v_capacity - 1 then
    update public.sessions
      set status = 'open'
      where id = p_session_id and status = 'matched';
  end if;
end;
$$;

revoke all on function public._eject_from_session(uuid, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- block_profile(blocked) — Block anlegen UND bestehenden Kontakt kappen
-- ------------------------------------------------------------------
-- In einer Transaktion: Block-Zeile setzen und jede Session auflösen, die uns beide
-- gerade verbindet. Regel: bin ich der Host, fliegt die geblockte Person raus; bin ich
-- Gast (egal ob die geblockte Person hostet oder ein Mitkletternder ist), gehe ICH.
-- So ist der/die Blockierende danach garantiert in keinem gemeinsamen Chat mehr, und
-- der Guard oben verhindert jeden Neu-Kontakt.
create or replace function public.block_profile(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  r record;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if v_me = p_blocked_id then
    raise exception 'You cannot block yourself';
  end if;

  insert into public.profile_blocks (blocker_id, blocked_id)
  values (v_me, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;

  -- Alle Sessions, an denen ICH hänge (als Host oder als aktives Mitglied), auf eine
  -- Verbindung zur geblockten Person prüfen und ggf. auflösen.
  for r in
    select s.id as session_id, s.creator_id
    from public.sessions s
    where s.creator_id = v_me
       or exists (
         select 1 from public.match_requests m
         where m.session_id = s.id
           and m.requester_id = v_me
           and m.status in ('pending', 'accepted')
       )
  loop
    if r.creator_id = v_me then
      -- Ich hoste: nur wenn die geblockte Person Mitglied ist → sie raus.
      if exists (
        select 1 from public.match_requests m
        where m.session_id = r.session_id
          and m.requester_id = p_blocked_id
          and m.status in ('pending', 'accepted')
      ) then
        perform public._eject_from_session(r.session_id, p_blocked_id);
      end if;
    else
      -- Ich bin Gast: verbindet uns, wenn die geblockte Person Host ODER Mitglied
      -- ist → ICH raus.
      if r.creator_id = p_blocked_id or exists (
        select 1 from public.match_requests m
        where m.session_id = r.session_id
          and m.requester_id = p_blocked_id
          and m.status in ('pending', 'accepted')
      ) then
        perform public._eject_from_session(r.session_id, v_me);
      end if;
    end if;
  end loop;
end;
$$;

revoke all on function public.block_profile(uuid) from public, anon;
grant execute on function public.block_profile(uuid) to authenticated;

-- ------------------------------------------------------------------
-- unblock_profile(blocked) — Block zurücknehmen
-- ------------------------------------------------------------------
-- Löscht nur die Block-Zeile. Weggegangene Mitgliedschaften werden NICHT
-- wiederhergestellt — man kann sich danach ganz normal neu zu Sessions verabreden.
create or replace function public.unblock_profile(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.profile_blocks
    where blocker_id = auth.uid() and blocked_id = p_blocked_id;
end;
$$;

revoke all on function public.unblock_profile(uuid) from public, anon;
grant execute on function public.unblock_profile(uuid) to authenticated;
