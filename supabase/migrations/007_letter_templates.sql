create table if not exists letter_templates (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  body text not null,
  style jsonb not null,
  created_at timestamptz default now()
);

alter table letter_templates enable row level security;

-- Drop first so this migration is safe to re-run in development
drop policy if exists "Users manage own templates" on letter_templates;
create policy "Users manage own templates"
  on letter_templates
  for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());
