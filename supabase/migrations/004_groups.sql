create table groups (
  id                uuid primary key default gen_random_uuid(),
  admin_id          uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  birthday_tracking boolean not null default false,
  created_at        timestamptz not null default now()
);

create table contact_groups (
  contact_id uuid not null references contacts(id) on delete cascade,
  group_id   uuid not null references groups(id) on delete cascade,
  primary key (contact_id, group_id)
);

alter table groups enable row level security;
alter table contact_groups enable row level security;

create policy "admin_all_groups" on groups for all using (auth.uid() = admin_id);

-- contact_groups: allow admin to manage assignments for their own contacts
create policy "admin_all_contact_groups" on contact_groups for all
  using (
    exists (
      select 1 from contacts c where c.id = contact_id and c.admin_id = auth.uid()
    )
  );
