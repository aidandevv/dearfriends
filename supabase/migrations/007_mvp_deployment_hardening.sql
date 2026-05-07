-- MVP deployment hardening.
-- Safe to run after the existing migrations on fresh or older environments.

-- Groups are created from authenticated server actions with only a name.
-- Default admin_id from the current Supabase auth context so inserts satisfy
-- the not-null constraint and RLS ownership checks.
alter table public.groups
  alter column admin_id set default auth.uid();

-- Keep the newer optional columns idempotent for environments that may have
-- been created from an older snapshot.
alter table public.contacts
  add column if not exists note text,
  add column if not exists birthday date,
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Make ownership checks explicit for inserts/updates as well as reads.
drop policy if exists "admin_all_groups" on public.groups;
create policy "admin_all_groups" on public.groups
  for all
  using (auth.uid() = admin_id)
  with check (auth.uid() = admin_id);

drop policy if exists "admin_all_contact_groups" on public.contact_groups;
create policy "admin_all_contact_groups" on public.contact_groups
  for all
  using (
    exists (
      select 1
      from public.contacts c
      where c.id = contact_id
        and c.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.contacts c
      where c.id = contact_id
        and c.admin_id = auth.uid()
    )
  );
