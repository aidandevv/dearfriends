alter table public.groups
  add column if not exists share_slug text;

create unique index if not exists groups_share_slug_unique
  on public.groups (share_slug)
  where share_slug is not null;

alter table public.groups
  drop constraint if exists groups_share_slug_format_check;

alter table public.groups
  add constraint groups_share_slug_format_check
  check (
    share_slug is null
    or share_slug ~ '^[a-z0-9_-]{3,30}$'
  );
