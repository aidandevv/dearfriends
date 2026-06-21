-- Enforce same-admin relationships for cross-table tenant links consumed by
-- service-role reminder jobs.

-- Remove any legacy rows that violate the intended invariant before adding
-- stricter runtime controls.
delete from public.contact_groups cg
using public.contacts c, public.groups g
where c.id = cg.contact_id
  and g.id = cg.group_id
  and c.admin_id <> g.admin_id;

update public.calendar_events e
set contact_id = null
from public.contacts c
where e.contact_id = c.id
  and e.admin_id <> c.admin_id;

drop policy if exists "admin_all_contact_groups" on public.contact_groups;
create policy "admin_all_contact_groups" on public.contact_groups
  for all
  using (
    exists (
      select 1
      from public.contacts c
      join public.groups g on g.id = group_id
      where c.id = contact_id
        and c.admin_id = auth.uid()
        and g.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.contacts c
      join public.groups g on g.id = group_id
      where c.id = contact_id
        and c.admin_id = auth.uid()
        and g.admin_id = auth.uid()
    )
  );

create or replace function public.enforce_contact_group_same_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.contacts c
    join public.groups g on g.id = new.group_id
    where c.id = new.contact_id
      and c.admin_id = g.admin_id
  ) then
    raise exception 'contact_groups rows must link contact and group for the same admin'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_contact_group_same_admin on public.contact_groups;
create trigger enforce_contact_group_same_admin
  before insert or update on public.contact_groups
  for each row execute function public.enforce_contact_group_same_admin();

create or replace function public.enforce_calendar_event_contact_same_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.contact_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.contacts c
    where c.id = new.contact_id
      and c.admin_id = new.admin_id
  ) then
    raise exception 'calendar_events.contact_id must belong to the event admin'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_calendar_event_contact_same_admin on public.calendar_events;
create trigger enforce_calendar_event_contact_same_admin
  before insert or update of admin_id, contact_id on public.calendar_events
  for each row execute function public.enforce_calendar_event_contact_same_admin();
