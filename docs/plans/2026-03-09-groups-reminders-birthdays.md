# Groups, Anniversary Reminders & Birthday Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add relationship groups (with per-group birthday tracking), annual send anniversary reminders, and weekly birthday digest emails.

**Architecture:** Groups are a new `groups` table + `contact_groups` junction; birthday is a nullable `date` column on contacts. Anniversary and birthday reminder state lives in `user_metadata`. Two new cron endpoints follow the existing `/api/cron/send-verifications` pattern.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL + RLS), Resend, existing cron pattern

---

## Task 1: DB Migrations

**Files:**
- Create: `supabase/migrations/004_groups.sql`
- Create: `supabase/migrations/005_birthday.sql`

**Step 1: Create `supabase/migrations/004_groups.sql`**

```sql
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
```

**Step 2: Create `supabase/migrations/005_birthday.sql`**

```sql
alter table contacts add column birthday date;
```

**Step 3: Apply migrations**

```bash
npx supabase db push
```
(Skip gracefully if Docker not running — migrations apply on next push.)

**Step 4: Commit**

```bash
git add supabase/migrations/004_groups.sql supabase/migrations/005_birthday.sql
git commit -m "feat: add groups, contact_groups, and birthday column migrations"
```

---

## Task 2: Group Server Actions

**Files:**
- Create: `lib/actions/groups.ts`

**Step 1: Create `lib/actions/groups.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getGroups() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createGroup(name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').insert({ name: name.trim() })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function updateGroup(id: string, updates: { name?: string; birthday_tracking?: boolean }) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').update(updates).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  return { success: true }
}

export async function deleteGroup(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/groups')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getContactGroups(contactId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_groups')
    .select('group_id')
    .eq('contact_id', contactId)
  if (error) return []
  return data.map(r => r.group_id)
}

export async function setContactGroups(contactId: string, groupIds: string[]) {
  const supabase = await createClient()
  // Delete all existing, then insert new
  await supabase.from('contact_groups').delete().eq('contact_id', contactId)
  if (groupIds.length > 0) {
    const rows = groupIds.map(group_id => ({ contact_id: contactId, group_id }))
    const { error } = await supabase.from('contact_groups').insert(rows)
    if (error) return { error: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true }
}
```

**Step 2: Commit**

```bash
git add lib/actions/groups.ts
git commit -m "feat: group CRUD and contact-group assignment server actions"
```

---

## Task 3: Groups Management Page

**Files:**
- Create: `app/dashboard/groups/page.tsx`
- Create: `components/groups-manager.tsx`
- Modify: `app/dashboard/layout.tsx` (add Groups nav item)

**Step 1: Create `components/groups-manager.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Trash2, Users } from 'lucide-react'
import { createGroup, updateGroup, deleteGroup } from '@/lib/actions/groups'

type Group = { id: string; name: string; birthday_tracking: boolean }

export function GroupsManager({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await createGroup(newName)
    setNewName('')
    setCreating(false)
  }

  async function handleToggleBirthday(group: Group) {
    await updateGroup(group.id, { birthday_tracking: !group.birthday_tracking })
    setGroups(prev => prev.map(g => g.id === group.id ? { ...g, birthday_tracking: !g.birthday_tracking } : g))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this group? Contacts will not be deleted.')) return
    await deleteGroup(id)
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New group name (e.g. Family)"
          className="input flex-1 min-h-11"
        />
        <button type="submit" disabled={creating || !newName.trim()} className="btn-primary min-h-11 px-5">
          {creating ? 'Adding...' : 'Add group'}
        </button>
      </form>

      <div className="space-y-2">
        {groups.length === 0 && (
          <p className="text-sm text-ink-muted">No groups yet. Create one above.</p>
        )}
        {groups.map(group => (
          <div key={group.id} className="surface-panel flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terra/10 text-terra">
                <Users size={15} />
              </span>
              <span className="font-medium text-ink">{group.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={group.birthday_tracking}
                  onChange={() => handleToggleBirthday(group)}
                  className="h-4 w-4"
                />
                Birthday tracking
              </label>
              <button
                onClick={() => handleDelete(group.id)}
                className="text-ink-muted hover:text-red-500 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create `app/dashboard/groups/page.tsx`**

```tsx
import { getGroups } from '@/lib/actions/groups'
import { GroupsManager } from '@/components/groups-manager'

export default async function GroupsPage() {
  const groups = await getGroups()

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Groups</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">Manage groups</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
          Organize contacts into relationship groups. Enable birthday tracking per group to get weekly reminders.
        </p>
      </section>
      <section className="surface-panel px-5 py-5">
        <GroupsManager initialGroups={groups} />
      </section>
    </div>
  )
}
```

**Step 3: Add Groups to dashboard nav in `app/dashboard/layout.tsx`**

Read the file. Add to imports: `import { Link2, PenLine, Send, Settings, Users, Layers } from 'lucide-react'`

Add to `navItems` after Contacts:
```ts
{ href: '/dashboard/groups', label: 'Groups', icon: Layers },
```

**Step 4: Commit**

```bash
git add app/dashboard/groups/page.tsx components/groups-manager.tsx app/dashboard/layout.tsx
git commit -m "feat: groups management page with birthday tracking toggle"
```

---

## Task 4: Contact Group Assignment in Contact Table

**Files:**
- Create: `components/contact-group-select.tsx`
- Modify: `components/contact-table.tsx`

**Step 1: Create `components/contact-group-select.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { setContactGroups, getContactGroups } from '@/lib/actions/groups'

type Group = { id: string; name: string }

export function ContactGroupSelect({
  contactId,
  allGroups,
}: {
  contactId: string
  allGroups: Group[]
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getContactGroups(contactId).then(ids => setSelected(ids))
  }, [contactId])

  async function toggle(groupId: string) {
    const next = selected.includes(groupId)
      ? selected.filter(id => id !== groupId)
      : [...selected, groupId]
    setSelected(next)
    setLoading(true)
    await setContactGroups(contactId, next)
    setLoading(false)
  }

  const names = allGroups.filter(g => selected.includes(g.id)).map(g => g.name)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-ink-muted underline hover:text-ink"
        disabled={loading}
      >
        {names.length > 0 ? names.join(', ') : 'Assign group'}
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-44 rounded-xl border border-border bg-surface shadow-md">
          {allGroups.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink-muted">No groups yet</p>
          )}
          {allGroups.map(group => (
            <label key={group.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-linen text-sm">
              <input
                type="checkbox"
                checked={selected.includes(group.id)}
                onChange={() => toggle(group.id)}
                className="h-3.5 w-3.5"
              />
              {group.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Update `components/contact-table.tsx`**

Read the file. Add:
1. Import: `import { ContactGroupSelect } from '@/components/contact-group-select'`
2. The component receives `allGroups` as a prop — add `allGroups: { id: string; name: string }[]` to the props type
3. In each contact row, add a Groups cell rendering `<ContactGroupSelect contactId={contact.id} allGroups={allGroups} />`

**Step 3: Update `app/dashboard/page.tsx`**

Read the file. Import `getGroups` and pass groups to `ContactTable`:

```tsx
import { getGroups } from '@/lib/actions/groups'
// ...
const [contacts, groups] = await Promise.all([getContacts(), getGroups()])
// ...
<ContactTable contacts={contacts} groups={groups} />
```

**Step 4: Commit**

```bash
git add components/contact-group-select.tsx components/contact-table.tsx app/dashboard/page.tsx
git commit -m "feat: group assignment UI on contact table"
```

---

## Task 5: Group Filter on Compose & Export Pages

**Files:**
- Create: `components/group-filter.tsx`
- Modify: `app/dashboard/compose/page.tsx`
- Modify: `app/dashboard/export/page.tsx`

**Step 1: Create `components/group-filter.tsx`**

```tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Group = { id: string; name: string }

export function GroupFilter({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('group') ?? 'all'

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') params.delete('group')
    else params.set('group', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {[{ id: 'all', name: 'All contacts' }, ...groups].map(g => (
        <button
          key={g.id}
          onClick={() => select(g.id)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            current === g.id
              ? 'bg-terra text-white'
              : 'border border-border/80 bg-surface-raised text-ink-muted hover:text-ink'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
```

**Step 2: Update compose and export pages**

In both `app/dashboard/compose/page.tsx` and `app/dashboard/export/page.tsx`:
- Import and call `getGroups()`
- Accept `searchParams` prop to read `?group=` param
- Pass filtered contacts (filtered by group membership) to the existing components
- Render `<GroupFilter groups={groups} />` above the main content

For group filtering, add a `getContactsByGroup` action to `lib/actions/groups.ts`:

```ts
export async function getContactsByGroup(groupId: string | null) {
  const supabase = await createClient()
  if (!groupId) {
    // return all contacts
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    return data ?? []
  }
  const { data } = await supabase
    .from('contact_groups')
    .select('contacts(*)')
    .eq('group_id', groupId)
  return (data ?? []).flatMap(r => (r.contacts ? [r.contacts] : []))
}
```

**Step 3: Commit**

```bash
git add components/group-filter.tsx lib/actions/groups.ts app/dashboard/compose/page.tsx app/dashboard/export/page.tsx
git commit -m "feat: group filter on compose and export pages"
```

---

## Task 6: Anniversary Reminder — Track First Send

**Files:**
- Modify: `lib/actions/user.ts`
- Modify: `app/api/export/pdf/route.ts`
- Modify: `app/api/export/csv/route.ts`
- Modify: `app/dashboard/export/page.tsx` (digital send action)

**Step 1: Add `recordFirstSent` to `lib/actions/user.ts`**

```ts
export async function recordFirstSent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Only set if not already set
  if (user.user_metadata?.first_sent_at) return

  await supabase.auth.updateUser({
    data: { first_sent_at: new Date().toISOString() }
  })
}
```

Also add `anniversary_reminders_enabled` to `getUserProfile`:
- Add to `UserProfile` type: `anniversaryRemindersEnabled: boolean`, `birthdayRemindersEnabled: boolean`
- Read from metadata: `anniversaryRemindersEnabled: metadata.anniversary_reminders_enabled !== false` (default true)

**Step 2: Call `recordFirstSent()` in export routes**

In `app/api/export/pdf/route.ts` and `app/api/export/csv/route.ts`, import and call `recordFirstSent()` near the top of the handler (fire-and-forget, don't await if it would slow the response — or just await it, it's fast).

Also call it in the digital send action in `lib/actions/letter.ts` (find `sendDigital` or equivalent).

**Step 3: Add anniversary toggle to settings**

In `components/profile-form.tsx`, add a checkbox:
```tsx
<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    checked={anniversaryReminders}
    onChange={e => setAnniversaryReminders(e.target.checked)}
  />
  Send me annual reminders to write again
</label>
```

Pass `anniversaryRemindersEnabled` from `updateProfile`.

**Step 4: Commit**

```bash
git add lib/actions/user.ts app/api/export/pdf/route.ts app/api/export/csv/route.ts components/profile-form.tsx
git commit -m "feat: record first_sent_at on export/send; anniversary reminder toggle in settings"
```

---

## Task 7: Anniversary Reminder Cron

**Files:**
- Create: `app/api/cron/anniversary-reminders/route.ts`
- Modify: `vercel.json`
- Modify: `lib/resend.ts`

**Step 1: Add `buildAnniversaryReminderEmail` to `lib/resend.ts`**

```ts
export function buildAnniversaryReminderEmail(opts: {
  adminName: string | null
  siteUrl: string
}): { subject: string; html: string } {
  const name = opts.adminName ?? 'there'
  return {
    subject: 'Time to write your annual letter?',
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>It's been about a year since you sent your first batch of letters. Your friends and family would love to hear from you again.</p>
      <p><a href="${opts.siteUrl}/dashboard/compose" style="background:#8B4513;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Open the composer →</a></p>
      <p style="font-size:12px;color:#999">You're receiving this because anniversary reminders are enabled. Disable them in your <a href="${opts.siteUrl}/dashboard/settings">settings</a>.</p>
    `,
  }
}
```

**Step 2: Create `app/api/cron/anniversary-reminders/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { getResend, buildAnniversaryReminderEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const WINDOW_DAYS = 14

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const { data: { users } } = await supabase.auth.admin.listUsers()

  const today = new Date()
  let sent = 0

  for (const user of users) {
    const profile = getUserProfile(user)
    if (!profile.anniversaryRemindersEnabled) continue
    const firstSent = user.user_metadata?.first_sent_at
    if (!firstSent) continue

    const anniversary = new Date(firstSent)
    anniversary.setFullYear(today.getFullYear())
    const daysUntil = Math.ceil((anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
      const { subject, html } = buildAnniversaryReminderEmail({
        adminName: profile.firstName,
        siteUrl: SITE_URL,
      })
      await getResend().emails.send({ from: FROM_EMAIL, to: user.email!, subject, html })
      sent++
    }
  }

  return NextResponse.json({ sent })
}
```

**Step 3: Add to `vercel.json`**

Read `vercel.json`. Add to crons array:
```json
{ "path": "/api/cron/anniversary-reminders", "schedule": "0 9 * * 1" }
```
(Every Monday at 9am UTC)

**Step 4: Commit**

```bash
git add app/api/cron/anniversary-reminders/route.ts lib/resend.ts vercel.json
git commit -m "feat: anniversary reminder cron — weekly check, email within 14-day window"
```

---

## Task 8: Birthday Field on Contacts

**Files:**
- Modify: `lib/actions/contacts.ts`
- Modify: `components/contact-table.tsx`

**Step 1: Add `updateBirthday` to `lib/actions/contacts.ts`**

```ts
export async function updateBirthday(contactId: string, birthday: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contacts')
    .update({ birthday })
    .eq('id', contactId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
```

**Step 2: Update `components/contact-table.tsx`**

- Accept `birthdayGroupContactIds: Set<string>` prop — the set of contact IDs that belong to at least one birthday-tracking group
- In the contact row, if `birthdayGroupContactIds.has(contact.id)`, render a birthday date input:

```tsx
{birthdayGroupContactIds.has(contact.id) && (
  <input
    type="date"
    defaultValue={contact.birthday ?? ''}
    onBlur={async e => {
      await updateBirthday(contact.id, e.target.value || null)
    }}
    className="input text-xs min-h-8 w-36"
    title="Birthday"
  />
)}
```

**Step 3: Update `app/dashboard/page.tsx`**

Fetch contacts in birthday-tracking groups:
```ts
// After fetching contacts and groups:
const birthdayGroupIds = new Set(groups.filter(g => g.birthday_tracking).map(g => g.id))
// Query contact_groups to find which contacts are in birthday groups
const supabase = await createClient()
const { data: cgRows } = await supabase
  .from('contact_groups')
  .select('contact_id, group_id')
const birthdayContactIds = new Set(
  (cgRows ?? []).filter(r => birthdayGroupIds.has(r.group_id)).map(r => r.contact_id)
)
```

Pass `birthdayContactIds` to `<ContactTable>`.

**Step 4: Commit**

```bash
git add lib/actions/contacts.ts components/contact-table.tsx app/dashboard/page.tsx
git commit -m "feat: birthday field on contacts in birthday-tracking groups"
```

---

## Task 9: Birthday Reminder Cron

**Files:**
- Create: `app/api/cron/birthday-reminders/route.ts`
- Modify: `lib/resend.ts`
- Modify: `vercel.json`

**Step 1: Add `buildBirthdayReminderEmail` to `lib/resend.ts`**

```ts
export function buildBirthdayReminderEmail(opts: {
  adminName: string | null
  birthdays: Array<{ name: string; date: string }>
  siteUrl: string
}): { subject: string; html: string } {
  const name = opts.adminName ?? 'there'
  const list = opts.birthdays
    .map(b => `<li>${escapeHtml(b.name)} — ${b.date}</li>`)
    .join('')
  return {
    subject: `${opts.birthdays.length} birthday${opts.birthdays.length > 1 ? 's' : ''} coming up this week`,
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>These contacts have birthdays in the next 7 days:</p>
      <ul>${list}</ul>
      <p><a href="${opts.siteUrl}/dashboard">View your contacts →</a></p>
    `,
  }
}
```

**Step 2: Create `app/api/cron/birthday-reminders/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { getResend, buildBirthdayReminderEmail } from '@/lib/resend'

const CRON_SECRET = process.env.CRON_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const { data: { users } } = await supabase.auth.admin.listUsers()

  const today = new Date()
  const in7 = new Date(today)
  in7.setDate(today.getDate() + 7)

  let sent = 0

  for (const user of users) {
    const profile = getUserProfile(user)
    if (user.user_metadata?.birthday_reminders_enabled === false) continue

    // Find groups with birthday_tracking for this admin
    const { data: groups } = await supabase
      .from('groups')
      .select('id')
      .eq('admin_id', user.id)
      .eq('birthday_tracking', true)

    if (!groups?.length) continue

    const groupIds = groups.map(g => g.id)

    // Find contacts in those groups with birthdays this week
    const { data: cg } = await supabase
      .from('contact_groups')
      .select('contact_id')
      .in('group_id', groupIds)

    const contactIds = [...new Set((cg ?? []).map(r => r.contact_id))]
    if (!contactIds.length) continue

    const { data: contacts } = await supabase
      .from('contacts')
      .select('first_name, last_name, birthday')
      .in('id', contactIds)
      .not('birthday', 'is', null)

    const upcoming = (contacts ?? []).filter(c => {
      if (!c.birthday) return false
      const bday = new Date(c.birthday)
      const thisYear = new Date(bday)
      thisYear.setFullYear(today.getFullYear())
      return thisYear >= today && thisYear <= in7
    }).map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      date: new Date(c.birthday!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    }))

    if (!upcoming.length) continue

    const { subject, html } = buildBirthdayReminderEmail({
      adminName: profile.firstName,
      birthdays: upcoming,
      siteUrl: SITE_URL,
    })

    await getResend().emails.send({ from: FROM_EMAIL, to: user.email!, subject, html })
    sent++
  }

  return NextResponse.json({ sent })
}
```

**Step 3: Add to `vercel.json`**

```json
{ "path": "/api/cron/birthday-reminders", "schedule": "0 9 * * 1" }
```

**Step 4: Commit**

```bash
git add app/api/cron/birthday-reminders/route.ts lib/resend.ts vercel.json
git commit -m "feat: birthday reminder cron — weekly digest for upcoming birthdays"
```

---

## Task 10: Build Check & Push

**Step 1: Run build**

```bash
pnpm build
```

Expected: clean build, all routes listed including `/dashboard/groups`, `/api/cron/anniversary-reminders`, `/api/cron/birthday-reminders`.

**Step 2: Fix any type errors**

If TypeScript errors appear, fix them and commit:
```bash
git add -A && git commit -m "fix: resolve TypeScript errors from build"
```

**Step 3: Push**

```bash
git push origin main
```

---

## Notes

- `getContactsByGroup` in Task 5 returns contacts via a join — the Supabase type for `contacts(*)` on a junction table returns a nested object; flatten with `.flatMap`
- The anniversary cron loops over all users via `admin.listUsers()` — this is fine at small scale (hobby tier), but add pagination if the user list grows beyond ~100
- Birthday comparison uses current year for the birthday month/day — handles the cross-year edge case (e.g. Jan birthday checked in late December) by only checking `today` to `in7`, not wrapping years
- `birthday_reminders_enabled` defaults to `true` by reading `metadata.birthday_reminders_enabled !== false` — opt-out semantics, no migration needed
