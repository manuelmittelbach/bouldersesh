-- Apple-Refresh-Tokens für die Sign-in-with-Apple-Token-Revocation
-- (ADR-0004-Update). Apple verlangt seit 2022: Wer Sign in with Apple anbietet
-- und Account-Löschung hat, muss beim Löschen Apples Tokens widerrufen —
-- sonst bleibt die App in den Apple-ID-Einstellungen als verbunden stehen und
-- die privaterelay-Adresse leitet weiter.
--
-- Der Token entsteht beim Login: die App schickt Apples authorizationCode an
-- die Edge Function `apple-token-exchange`, die ihn gegen einen Refresh-Token
-- tauscht und hier ablegt. `delete-account` liest ihn vor dem Löschen und ruft
-- Apples Revoke-Endpunkt. Pro Account genügt EIN Token (der jeweils neueste) —
-- ein Revoke widerruft die gesamte Apple-Verknüpfung, nicht nur eine Session.

create table public.apple_refresh_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.apple_refresh_tokens enable row level security;

-- Bewusst KEINE Policies: nur die Edge Functions (service_role) fassen die
-- Tabelle an. Grants explizit auch für anon entziehen (Lint-Lehre aus 0028:
-- `revoke from public` sperrt die eingebauten Rollen NICHT aus).
revoke all on public.apple_refresh_tokens from anon, authenticated;
