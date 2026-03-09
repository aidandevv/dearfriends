# Design: Groups, Anniversary Reminders & Birthday Tracking

**Date:** 2026-03-09

---

## Overview

Three interconnected features that deepen the relationship layer of NomadMail:
- **Groups** — permanent relationship labels (Family, College, Work) with per-group settings
- **Send anniversary reminders** — email the admin annually when it's time to send again
- **Birthday tracking** — per-group toggle; admin gets a weekly digest of upcoming birthdays

---

## Feature 1: Groups

### Schema

```sql
create table groups (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  birthday_tracking boolean not null default false,
  created_at timestamptz not null default now()
);

create table contact_groups (
  contact_id uuid not null references contacts(id) on delete cascade,
  group_id   uuid not null references groups(id) on delete cascade,
  primary key (contact_id, group_id)
);
```

RLS: both tables enforce `admin_id = auth.uid()` (groups) and join-based ownership (contact_groups).

### UX

- `/dashboard/groups` — create/rename/delete groups, toggle `birthday_tracking` per group
- Contact table — "Groups" column with multi-select dropdown to assign/unassign
- Compose & Export pages — group filter: "Send to: All | [group names]"
- Existing `tags` column remains as freeform labels (separate concept)

---

## Feature 2: Send Anniversary Reminders

### Data

Stored in `user_metadata` (no new table):
- `first_sent_at` — ISO timestamp, written once on first digital send or PDF export, never overwritten
- `anniversary_reminders_enabled` — boolean (default `true`)

### Logic

- When admin triggers digital send or export: check if `first_sent_at` is set; if not, set it now
- Weekly cron (`/api/cron/anniversary-reminders`): for each admin where `anniversary_reminders_enabled = true` and `first_sent_at` is set, check if today is within 14 days before the annual anniversary — if so, send reminder email
- Reminder email: "You sent your first letters 1 year ago. Time to draft this year's? [Open composer →]"
- Opt-out toggle in `/dashboard/settings`

---

## Feature 3: Birthday Tracking

### Schema

```sql
alter table contacts add column birthday date;
```

### Logic

- Birthday field is editable on a contact only if that contact belongs to at least one group with `birthday_tracking = true`
- Weekly cron (`/api/cron/birthday-reminders`): find all contacts with a birthday in the next 7 days, grouped by admin — send each admin a digest: "Upcoming birthdays this week: Sarah Chen (Mar 15), Mike Torres (Mar 18)"
- `birthday_reminders_enabled` boolean in `user_metadata` (default `true`)
- Cron only runs if admin has at least one group with `birthday_tracking = true`

### UX

- Birthday input appears in the contact row edit mode when contact is in a birthday-tracking group
- Shown as month/day only in the digest email (no year — privacy)
- Admin can also set birthdays from `/dashboard/groups` contact list view

---

## Database Changes Summary

| Change | Detail |
|--------|--------|
| New `groups` table | `id`, `admin_id`, `name`, `birthday_tracking`, `created_at` |
| New `contact_groups` table | `contact_id`, `group_id` composite PK |
| `contacts.birthday` | `date`, nullable |
| `user_metadata.first_sent_at` | ISO string, set on first send |
| `user_metadata.anniversary_reminders_enabled` | boolean |
| `user_metadata.birthday_reminders_enabled` | boolean |

---

## Out of Scope

- Group-specific share links (future)
- Group stats / analytics (future)
- Recipients entering their own birthday on the share form (future)
- Bulk birthday import (future)
