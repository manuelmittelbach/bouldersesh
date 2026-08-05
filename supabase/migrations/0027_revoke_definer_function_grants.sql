-- Execute-Grants auf SECURITY-DEFINER-Funktionen einziehen
-- (Advisor-Lints 0028/0029).
--
-- Postgres granted EXECUTE auf neue Funktionen automatisch an public, und
-- Supabase gibt anon/authenticated zusätzlich DIREKTE Grants — ein
-- `revoke … from public` allein lässt die stehen (siehe 0016). Dadurch waren
-- alle vier Funktionen hier für anon per /rest/v1/rpc/... aufrufbar.
--
-- Die drei handle_*-Funktionen sind reine Trigger-Funktionen: Trigger prüfen
-- EXECUTE nur bei der Trigger-Erstellung, nie zur Laufzeit — sie brauchen
-- also gar keine Grants und werden komplett eingezogen (auch authenticated).
-- is_chat_member wird von RLS-Policies im Kontext der anfragenden Rolle
-- ausgewertet; alle nutzenden Policies gelten `to authenticated`, daher
-- behält authenticated EXECUTE (Grant aus 0005), nur anon fliegt raus.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_match_accepted() from public, anon, authenticated;
revoke all on function public.handle_session_created() from public, anon, authenticated;

revoke all on function public.is_chat_member(uuid) from anon;
