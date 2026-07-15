-- Reconcile environments created from older snapshots without reusing an
-- already-published migration version. This file replaces the former duplicate
-- 006_reconcile_schema_with_prod.sql migration. Every operation is safe to run
-- after migrations 001-011 and safe to repeat across partially reconciled
-- environments.

-- 1) Ensure contacts.note exists (used by note-back feature).
alter table public.contacts
  add column if not exists note text;

-- 2) Ensure one contact per (admin_id, email).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contacts_admin_id_email_key'
      and conrelid = 'public.contacts'::regclass
  ) then
    if exists (
      select 1
      from public.contacts
      group by admin_id, email
      having count(*) > 1
    ) then
      raise exception 'Cannot add unique constraint contacts_admin_id_email_key: duplicate (admin_id, email) rows exist in public.contacts';
    end if;

    alter table public.contacts
      add constraint contacts_admin_id_email_key unique (admin_id, email);
  end if;
end
$$;

-- 3) Align foreign keys to ON DELETE CASCADE.
alter table public.contacts
  drop constraint if exists contacts_admin_id_fkey,
  add constraint contacts_admin_id_fkey
    foreign key (admin_id) references auth.users(id) on delete cascade;

alter table public.letter_drafts
  drop constraint if exists letter_drafts_admin_id_fkey,
  add constraint letter_drafts_admin_id_fkey
    foreign key (admin_id) references auth.users(id) on delete cascade;

alter table public.scheduled_verifications
  drop constraint if exists scheduled_verifications_admin_id_fkey,
  add constraint scheduled_verifications_admin_id_fkey
    foreign key (admin_id) references auth.users(id) on delete cascade;

alter table public.groups
  drop constraint if exists groups_admin_id_fkey,
  add constraint groups_admin_id_fkey
    foreign key (admin_id) references auth.users(id) on delete cascade;

alter table public.contact_groups
  drop constraint if exists contact_groups_contact_id_fkey,
  add constraint contact_groups_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete cascade;

alter table public.contact_groups
  drop constraint if exists contact_groups_group_id_fkey,
  add constraint contact_groups_group_id_fkey
    foreign key (group_id) references public.groups(id) on delete cascade;
