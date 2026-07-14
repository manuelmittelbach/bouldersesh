-- Enable Supabase Realtime for the tables the UI subscribes to.
--
-- The `supabase_realtime` publication starts empty on a fresh project, so the
-- client-side postgres_changes subscriptions (chat messages, incoming match
-- requests) never received events. Adding the tables here makes them live.
--
-- Realtime still enforces RLS: a subscriber only receives rows they are allowed
-- to SELECT under the policies in 0002_rls.sql.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.match_requests;
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.chat_members;
