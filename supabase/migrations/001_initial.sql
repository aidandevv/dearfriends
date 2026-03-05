-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Contacts
create table contacts (
  id                   uuid primary key default gen_random_uuid(),
  admin_id             uuid not null references auth.users(id) on delete cascade,
  first_name           text not null,
  last_name            text not null,
  email                text not null,
  address_line_1       text not null,
  address_line_2       text,
  city                 text not null,
  state                text not null,
  zip                  text not null,
  tags                 text[] not null default '{}',
  delivery_method      text not null default 'print',
  opted_out            boolean not null default false,
  verification_token   uuid,
  verification_sent_at timestamptz,
  verified_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (admin_id, email)
);

-- Letter drafts (one per admin, upserted)
create table letter_drafts (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id) on delete cascade unique,
  subject    text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scheduled verification sends
create table scheduled_verifications (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id) on delete cascade,
  send_at    timestamptz not null,
  sent       boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table contacts enable row level security;
alter table letter_drafts enable row level security;
alter table scheduled_verifications enable row level security;

-- contacts: admin CRUD
create policy "admin_select" on contacts for select using (auth.uid() = admin_id);
create policy "admin_insert" on contacts for insert with check (auth.uid() = admin_id);
create policy "admin_update" on contacts for update using (auth.uid() = admin_id);
create policy "admin_delete" on contacts for delete using (auth.uid() = admin_id);

-- contacts: public insert via share form (admin_id must be valid user)
create policy "public_share_insert" on contacts for insert
  with check (
    admin_id in (select id from auth.users)
  );

-- contacts: public update via verify token (no auth)
create policy "public_verify_update" on contacts for update
  using (verification_token is not null)
  with check (verification_token is not null);

-- letter_drafts: admin only
create policy "admin_all_drafts" on letter_drafts for all using (auth.uid() = admin_id);

-- scheduled_verifications: admin only
create policy "admin_all_schedules" on scheduled_verifications for all using (auth.uid() = admin_id);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger contacts_updated_at before update on contacts
  for each row execute function update_updated_at();

create trigger letter_drafts_updated_at before update on letter_drafts
  for each row execute function update_updated_at();
