-- ADR-0009 (Folge von ADR-0007, Gruppen-Sessions): die „Climbers"-Liste auf der
-- Session-Detailseite. Wer bereits beigetreten ist, soll auch für Außenstehende
-- sichtbar sein — genau die Person, die überlegt beizutreten, öffnet diese Seite.
-- Bisher las die SELECT-Policy nur Ersteller:in und Anfragende:r ihre Zeilen (0002);
-- ein fremder Blick sah niemanden.
--
-- Wir öffnen NUR den bestätigten Kader (`status = 'accepted'`) öffentlicher
-- Sessions. Pending/declined/cancelled bleiben privat wie zuvor — offen liegt
-- allein die Tatsache, dass Person X einer öffentlichen Session beigetreten ist.
-- Profile selbst sind ohnehin für alle Authentifizierten lesbar (0002), also ist
-- das die einzige neue Offenlegung. Die Unterabfrage trifft `sessions`, nicht
-- `match_requests` — keine Rekursion (vgl. 0005).

drop policy if exists "match requests readable to parties" on public.match_requests;

create policy "match requests readable to parties"
  on public.match_requests for select
  to authenticated
  using (
    requester_id = auth.uid()
    or session_id in (select id from public.sessions where creator_id = auth.uid())
    or (
      status = 'accepted'
      and session_id in (
        select id from public.sessions where visibility = 'public'
      )
    )
  );
