begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(8);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner-a@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'owner-b@example.test');

insert into public.contacts (
  id, admin_id, first_name, last_name, email, address_line_1, city, state, zip
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Ada', 'Owner', 'ada@owner-a.test', '1 Test Way', 'Austin', 'TX', '78701'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Bea', 'Other', 'bea@owner-b.test', '2 Test Way', 'Boston', 'MA', '02108');

insert into public.groups (id, admin_id, name)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Owner A group'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Owner B group');

select policies_are(
  'public',
  'contacts',
  array['admin_delete', 'admin_insert', 'admin_select', 'admin_update'],
  'contacts expose only authenticated owner policies'
);

select policies_are(
  'public',
  'contact_groups',
  array['admin_all_contact_groups'],
  'contact-group relationships have one owner policy'
);

select policies_are(
  'public',
  'calendar_events',
  array['admin_all_calendar_events'],
  'calendar events have one owner policy'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select email from public.contacts order by email$$,
  array['ada@owner-a.test']::text[],
  'an authenticated owner only reads their contacts'
);

select results_eq(
  $$select name from public.groups order by name$$,
  array['Owner A group']::text[],
  'an authenticated owner only reads their groups'
);

reset role;

select throws_ok(
  $$
    insert into public.contact_groups (contact_id, group_id)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd')
  $$,
  '23514',
  'contact_groups rows must link contact and group for the same admin',
  'cross-tenant contact group links are rejected by the database'
);

select throws_ok(
  $$
    insert into public.calendar_events (admin_id, contact_id, title, event_date)
    values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Cross-tenant event', '2026-01-01')
  $$,
  '23514',
  'calendar_events.contact_id must belong to the event admin',
  'cross-tenant calendar contact links are rejected by the database'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.contacts'::regclass),
  'contacts keep row-level security enabled'
);

select * from finish();
rollback;
