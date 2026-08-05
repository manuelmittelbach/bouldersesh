-- Push-Tokens für Expo-Push-Notifications (Launch-Plan Punkt 5).
--
-- Ein Expo-Push-Token identifiziert genau EINE App-Installation auf EINEM
-- Gerät — deshalb ist `token` der Primärschlüssel, nicht (user_id, token):
-- pro Gerät gehört der Token immer genau einem Account, und ein Account kann
-- mehrere Geräte haben.

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);

-- Die Edge Function (send-push) sucht Tokens per user_id.
create index push_tokens_user_id_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

-- Lesen/Löschen nur der eigenen Zeilen (Delete = Abmelden beim Logout).
create policy "push tokens readable by owner"
  on public.push_tokens for select
  to authenticated
  using (user_id = auth.uid());

create policy "push tokens delete own"
  on public.push_tokens for delete
  to authenticated
  using (user_id = auth.uid());

-- Registrieren läuft NICHT über RLS-Insert/-Update, sondern über diese
-- SECURITY-DEFINER-Funktion: Ein Token kann den Besitzer wechseln (Logout →
-- Login mit anderem Account auf demselben Gerät, oder der Logout-Delete ging
-- offline verloren). Ein normales Upsert scheiterte dann an der RLS der
-- fremden Zeile — die Funktion übernimmt die Zeile stattdessen für auth.uid().
-- Fremde Tokens „kapern" kann man damit nur, wenn man den Token-String kennt,
-- und den kennt nur das Gerät selbst (und Expo).
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        updated_at = now();
$$;

-- Grants einziehen (Lehre aus 0016/0027): revoke from public reicht nicht,
-- anon hat direkte Grants. authenticated behält EXECUTE — das ist der Aufrufer.
revoke all on function public.register_push_token(text, text) from public, anon;
