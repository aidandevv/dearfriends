-- Calendar/reminder MVP.
-- Stores imported/manual dates and delivery reminder state.

alter table public.contacts
  add column if not exists is_international boolean not null default false,
  add column if not exists country text;

create table if not exists public.calendar_sources (
  id               uuid primary key default gen_random_uuid(),
  admin_id         uuid not null references auth.users(id) on delete cascade default auth.uid(),
  provider         text not null default 'ics',
  name             text not null,
  subscription_url text not null,
  imported_at      timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id                     uuid primary key default gen_random_uuid(),
  admin_id               uuid not null references auth.users(id) on delete cascade default auth.uid(),
  calendar_source_id     uuid references public.calendar_sources(id) on delete set null,
  contact_id             uuid references public.contacts(id) on delete set null,
  title                  text not null,
  event_type             text not null default 'custom'
    check (event_type in ('birthday', 'anniversary', 'holiday', 'custom')),
  event_date             date not null,
  recurrence             text not null default 'yearly'
    check (recurrence in ('none', 'yearly')),
  source                 text not null default 'manual'
    check (source in ('manual', 'google', 'outlook', 'ics')),
  source_event_uid       text,
  reminder_enabled       boolean not null default true,
  last_reminder_sent_for date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create unique index if not exists calendar_events_source_uid_key
  on public.calendar_events(admin_id, calendar_source_id, source_event_uid)
  where source_event_uid is not null;

alter table public.calendar_sources enable row level security;
alter table public.calendar_events enable row level security;

drop policy if exists "admin_all_calendar_sources" on public.calendar_sources;
create policy "admin_all_calendar_sources" on public.calendar_sources
  for all
  using (auth.uid() = admin_id)
  with check (auth.uid() = admin_id);

drop policy if exists "admin_all_calendar_events" on public.calendar_events;
create policy "admin_all_calendar_events" on public.calendar_events
  for all
  using (auth.uid() = admin_id)
  with check (auth.uid() = admin_id);

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function update_updated_at();
