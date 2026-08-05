-- Accept-Push an die handle_match_accepted-Semantik angleichen (Review-Finding).
--
-- 0014/0017 behandeln JEDEN Übergang <> 'accepted' → 'accepted' als Beitritt —
-- auch cancelled → accepted, wenn der Rückzug der anfragenden Person den
-- Accept-Tap des Hosts überholt. Der Push-Trigger aus 0029 verlangte dagegen
-- old.status = 'pending': In genau dieser Race trat jemand dem Chat bei, ohne
-- den "You're in!"-Push zu bekommen. Beide Trigger teilen jetzt dieselbe Kante.

drop trigger if exists notify_push_request_accepted on public.match_requests;

create trigger notify_push_request_accepted
  after update of status on public.match_requests
  for each row
  when (old.status is distinct from 'accepted' and new.status = 'accepted')
  execute function public.notify_push('request_accepted');
