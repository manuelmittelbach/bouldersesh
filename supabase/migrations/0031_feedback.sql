-- App-Feedback (Freitext aus dem Account-Screen). Gelesen wird ausschließlich
-- per service_role im Dashboard — die App kann nur senden, nie lesen. Deshalb
-- gibt es bewusst KEINE select-Policy und keinen Query-Pfad im Client.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  -- Feedback ist eine Aussage über die App, nicht über die Person: löscht
  -- jemand den Account, bleibt die Rückmeldung als anonymer Eintrag stehen.
  user_id uuid references public.profiles(id) on delete set null,
  message text not null check (length(message) between 1 and 2000),
  -- Kontext zum Einordnen: aus welcher Version/Plattform kam die Meldung?
  -- Freiwillig (der Client füllt sie), nicht erzwungen — eine fehlende Version
  -- soll das Absenden nie verhindern.
  app_version text check (app_version is null or length(app_version) <= 32),
  platform text check (platform is null or platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  -- Von Hand im Dashboard gesetzt, sobald jemand hingesehen hat.
  handled_at timestamptz
);

create index feedback_open_idx
  on public.feedback (created_at)
  where handled_at is null;

alter table public.feedback enable row level security;

-- Senden nur in eigenem Namen.
create policy "feedback insert as self"
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());
