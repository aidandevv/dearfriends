# Custom Share Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins share their address-collection form via a memorable slug URL (e.g. `/share/johndoe`) instead of a raw UUID, with an auto-generated 8-char code as the default.

**Architecture:** The slug is stored in `raw_user_meta_data.share_slug` on the Supabase auth user — no new table needed. The existing `app/(public)/share/[adminId]/page.tsx` is renamed to `[segment]` and gains runtime UUID-vs-slug discrimination. Three new server actions handle generation, update, and resolution of slugs. The dashboard gets a share-link card; settings gets a slug mini-form.

**Tech Stack:** Next.js App Router, Supabase (anon + service-role clients), Zod, Vitest, Tailwind CSS.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/supabase/server.ts` | Modify | Add `createAdminClient()` using `@supabase/supabase-js` directly (required for `auth.admin.*` methods) |
| `lib/schemas.ts` | Modify | Add `slugSchema` Zod validator |
| `lib/schemas.test.ts` | Modify | Tests for `slugSchema` |
| `lib/user-profile.ts` | Modify | Add `shareSlug: string \| null` to `UserProfile` |
| `lib/user-profile.test.ts` | Create | Tests for `shareSlug` extraction |
| `lib/actions/user.ts` | Modify | Add `generateShareSlug`, `updateShareSlug`, `resolveSlugToAdminId`; update `completeOnboarding` |
| `app/(public)/share/[adminId]/page.tsx` | Delete (rename) | Replaced by `[segment]` |
| `app/(public)/share/[segment]/page.tsx` | Create | UUID-vs-slug catch-all share route |
| `components/share-link-card.tsx` | Create | Dashboard sidebar share-link card |
| `app/dashboard/page.tsx` | Modify | Fetch profile, lazy slug generation, add `ShareLinkCard` |
| `components/profile-form.tsx` | Modify | Add slug mini-form below existing profile form |
| `app/dashboard/settings/page.tsx` | Modify | Pass `shareSlug` to `ProfileForm` |

---

## Task 1: Add `createAdminClient` helper

**Files:**
- Modify: `lib/supabase/server.ts`

`createServiceClient` is built on `@supabase/ssr` and does not expose `auth.admin.*` methods. A separate admin client using `@supabase/supabase-js` directly is required for `listUsers`, `getUserById`, and `updateUserById`.

- [ ] **Step 1: Add `createAdminClient` to `lib/supabase/server.ts`**

Append to the end of `lib/supabase/server.ts`:

```ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
```

Note: this is a **synchronous** function — no `await`, no cookies. It uses the service role key directly and is only called from server-side code.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat: add createAdminClient for auth.admin.* operations"
```

---

## Task 2: Add `slugSchema` to schemas

**Files:**
- Modify: `lib/schemas.ts`
- Modify: `lib/schemas.test.ts`

- [ ] **Step 1: Write failing tests for `slugSchema`**

In `lib/schemas.test.ts`:
1. Update the top-level import to include `slugSchema`: `import { contactSchema, letterDraftSchema, slugSchema } from './schemas'`
2. Add after the existing `letterDraftSchema` describe block:

```ts
describe('slugSchema', () => {
  it('accepts valid slug', () => {
    expect(slugSchema.safeParse('hello-world').success).toBe(true)
  })

  it('accepts underscores', () => {
    expect(slugSchema.safeParse('my_slug').success).toBe(true)
  })

  it('accepts digits', () => {
    expect(slugSchema.safeParse('abc123').success).toBe(true)
  })

  it('rejects uppercase (lowercasing is caller responsibility)', () => {
    expect(slugSchema.safeParse('Hello').success).toBe(false)
  })

  it('rejects too short', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false)
  })

  it('rejects too long', () => {
    expect(slugSchema.safeParse('a'.repeat(31)).success).toBe(false)
  })

  it('rejects reserved slug: login', () => {
    expect(slugSchema.safeParse('login').success).toBe(false)
  })

  it('rejects reserved slug: dashboard', () => {
    expect(slugSchema.safeParse('dashboard').success).toBe(false)
  })

  it('rejects reserved slug: api', () => {
    expect(slugSchema.safeParse('api').success).toBe(false)
  })

  it('rejects spaces', () => {
    expect(slugSchema.safeParse('hello world').success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E 'slugSchema|FAIL|cannot find'
```

Expected: FAIL — `slugSchema` not exported from `./schemas`.

- [ ] **Step 3: Implement `slugSchema` in `lib/schemas.ts`**

Add at the end of `lib/schemas.ts`:

```ts
const RESERVED_SLUGS = new Set([
  'login', 'dashboard', 'share', 'verify', 'about',
  'onboarding', 'api', 'settings', 's',
])

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9_-]{3,30}$/, 'Slug must be 3–30 lowercase letters, numbers, hyphens, or underscores')
  .refine(s => !RESERVED_SLUGS.has(s), { message: 'That slug is reserved' })

export type SlugInput = z.infer<typeof slugSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E 'slugSchema|passed|failed'
```

Expected: all `slugSchema` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/schemas.ts lib/schemas.test.ts
git commit -m "feat: add slugSchema with reserved-slug validation"
```

---

## Task 2: Extend `getUserProfile` with `shareSlug`

**Files:**
- Modify: `lib/user-profile.ts`
- Create: `lib/user-profile.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/user-profile.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getUserProfile } from './user-profile'

describe('getUserProfile shareSlug', () => {
  it('returns shareSlug from metadata', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada', share_slug: 'ada123' } })
    expect(profile.shareSlug).toBe('ada123')
  })

  it('returns null when share_slug absent', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada' } })
    expect(profile.shareSlug).toBeNull()
  })

  it('returns null when share_slug is empty string', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada', share_slug: '' } })
    expect(profile.shareSlug).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E 'shareSlug|FAIL|property'
```

Expected: FAIL — `shareSlug` is `undefined`, not `null` / `'ada123'`.

- [ ] **Step 3: Add `shareSlug` to `UserProfile` and `getUserProfile`**

In `lib/user-profile.ts`:

1. Add `shareSlug: string | null` to the `UserProfile` type after `birthdayRemindersEnabled`.

2. In the `return` block of `getUserProfile`, add:
```ts
shareSlug: readString(metadata.share_slug),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E 'shareSlug|passed|failed'
```

Expected: all 3 `shareSlug` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/user-profile.ts lib/user-profile.test.ts
git commit -m "feat: expose shareSlug from getUserProfile"
```

---

## Task 5: Add slug server actions

**Files:**
- Modify: `lib/actions/user.ts`

No unit tests for these actions — they require a live Supabase admin connection. Correctness is verified by integration in Tasks 6–9.

> **Important:** All `auth.admin.*` calls use `createAdminClient()` (from Task 1), NOT `createServiceClient()`. The `createServiceClient` uses `@supabase/ssr` which lacks `auth.admin.*` methods; `createAdminClient` uses `@supabase/supabase-js` directly and has them.

- [ ] **Step 1: Add imports at the top of `lib/actions/user.ts`**

After the existing imports, add:

```ts
import { createAdminClient } from '@/lib/supabase/server'
import { slugSchema } from '@/lib/schemas'
```

> `revalidatePath` and `createClient` are already imported.

- [ ] **Step 2: Add `resolveSlugToAdminId`**

Append to `lib/actions/user.ts`:

```ts
// Scans all auth users for a matching share_slug. Returns adminId or null.
export async function resolveSlugToAdminId(slug: string): Promise<string | null> {
  const admin = createAdminClient()
  const normalised = slug.toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    const match = data.users.find(
      u => u.user_metadata?.share_slug === normalised
    )
    if (match) return match.id
    if (data.users.length < perPage) break
    page++
  }
  return null
}
```

- [ ] **Step 3: Add `generateShareSlug`**

Append to `lib/actions/user.ts`:

```ts
function randomSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Generates and saves an 8-char share slug for the given user.
// Pass userId when the caller already has it; omit to resolve from session.
export async function generateShareSlug(userId?: string): Promise<string> {
  const admin = createAdminClient()

  const resolvedId = userId ?? (await (await createClient()).auth.getUser()).data.user?.id
  if (!resolvedId) throw new Error('Not authenticated')

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = randomSlug()
    const existing = await resolveSlugToAdminId(slug)
    if (existing) continue  // collision — try again

    const { data: userData } = await admin.auth.admin.getUserById(resolvedId)
    const existingMeta = userData.user?.user_metadata ?? {}
    const { error } = await admin.auth.admin.updateUserById(resolvedId, {
      user_metadata: { ...existingMeta, share_slug: slug },
    })
    if (error) throw new Error(error.message)
    return slug
  }
  throw new Error('Could not generate a unique share slug after 3 attempts')
}
```

- [ ] **Step 4: Add `updateShareSlug`**

Append to `lib/actions/user.ts`:

```ts
export async function updateShareSlug(slug: string): Promise<{ error?: string }> {
  const normalised = slug.toLowerCase()
  const parsed = slugSchema.safeParse(normalised)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid slug' }

  const anon = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await anon.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Check uniqueness, excluding the calling user's own current slug
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    const conflict = data.users.find(
      u => u.id !== user.id && u.user_metadata?.share_slug === normalised
    )
    if (conflict) return { error: 'slug_taken' }
    if (data.users.length < perPage) break
    page++
  }

  const { data: userData } = await admin.auth.admin.getUserById(user.id)
  const existingMeta = userData.user?.user_metadata ?? {}
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...existingMeta, share_slug: normalised },
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return {}
}
```

- [ ] **Step 5: Update `completeOnboarding` to generate a slug**

In the `completeOnboarding` function, after the `if (error) return { error: error.message }` check and before `revalidatePath`, add:

```ts
  // Fire-and-forget slug generation — don't block onboarding on failure
  try {
    await generateShareSlug(user.id)
  } catch {
    // Non-fatal: slug will be generated lazily on first dashboard visit
  }
```

- [ ] **Step 6: Typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: no errors related to the new actions.

- [ ] **Step 7: Commit**

```bash
git add lib/actions/user.ts
git commit -m "feat: add generateShareSlug, updateShareSlug, resolveSlugToAdminId server actions"
```

---

## Task 6: Replace `[adminId]` route with `[segment]` catch-all

**Files:**
- Delete: `app/(public)/share/[adminId]/page.tsx`
- Create: `app/(public)/share/[segment]/page.tsx`

The new route replaces the old one. It handles both UUID segments (direct `getUserById`) and slug segments (via `resolveSlugToAdminId`).

- [ ] **Step 1: Create the new route file**

Create `app/(public)/share/[segment]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShareForm } from '@/components/share-form'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveSlugToAdminId } from '@/lib/actions/user'
import { getUserProfile } from '@/lib/user-profile'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveAdminId(segment: string): Promise<string | null> {
  if (UUID_RE.test(segment)) {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(segment)
    return data.user?.id ?? null
  }
  return resolveSlugToAdminId(segment)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string }>
}): Promise<Metadata> {
  const { segment } = await params
  const adminId = await resolveAdminId(segment)
  if (!adminId) return { title: 'Not found' }

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(adminId)
  const profile = getUserProfile(data.user)

  const name = profile.firstName ?? profile.fullName ?? 'Someone'
  const title = `${name} wants to send you something`
  const description =
    profile.bio ??
    `${name} is putting together something special and would love to send it your way. Share your address to receive real mail.`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const isSlug = !UUID_RE.test(segment)
  const canonicalUrl = isSlug
    ? `${siteUrl}/share/${segment}`
    : `${siteUrl}/share/${adminId}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Dear Friends',
    },
    twitter: { card: 'summary', title, description },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const adminId = await resolveAdminId(segment)
  if (!adminId) notFound()

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.getUserById(adminId)
  const senderProfile = getUserProfile(data.user)

  return (
    <ShareForm
      adminId={adminId}
      senderName={senderProfile.fullName}
      senderBio={senderProfile.bio}
    />
  )
}
```

- [ ] **Step 2: Delete the old route folder**

```bash
rm -rf "app/(public)/share/[adminId]"
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Smoke test the route manually**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/share/nonexistent-slug
```

Expected: `404`.

Kill the dev server after testing (`kill %1` or Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add "app/(public)/share/[segment]"
git commit -m "feat: replace [adminId] share route with [segment] catch-all (UUID + slug)"
```

---

## Task 7: Create `ShareLinkCard` dashboard component

**Files:**
- Create: `components/share-link-card.tsx`

The existing `components/share-link-actions.tsx` already provides a copy + view button client component. `ShareLinkCard` is a server component wrapper that displays the slug URL and reuses `ShareLinkActions`.

- [ ] **Step 1: Create `components/share-link-card.tsx`**

```tsx
import Link from 'next/link'
import { ShareLinkActions } from '@/components/share-link-actions'

interface ShareLinkCardProps {
  shareSlug: string | null
}

export function ShareLinkCard({ shareSlug }: ShareLinkCardProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = shareSlug ? `${siteUrl}/share/${shareSlug}` : null

  return (
    <section className="surface-panel px-5 py-5">
      <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Your share link</p>
      {url ? (
        <>
          <p className="mt-3 break-all font-mono text-sm text-ink">{url}</p>
          <ShareLinkActions url={url} />
          <Link
            href="/dashboard/settings"
            className="mt-3 block text-xs text-ink-muted hover:text-ink transition-colors"
          >
            Edit slug →
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-ink-muted">
          Your link is being set up — refresh to try again.
        </p>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | grep -E 'share-link-card|error'
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/share-link-card.tsx
git commit -m "feat: add ShareLinkCard sidebar component"
```

---

## Task 8: Wire `ShareLinkCard` into the dashboard

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Update `app/dashboard/page.tsx`**

Replace the entire file with:

```tsx
import { ContactTable } from '@/components/contact-table'
import { ScheduleVerificationForm } from '@/components/schedule-verification-form'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ShareLinkCard } from '@/components/share-link-card'
import { getContacts } from '@/lib/actions/contacts'
import { getGroups } from '@/lib/actions/groups'
import { generateShareSlug } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = getUserProfile(user)

  // Lazy slug generation — runs for users who signed up before this feature deployed.
  // generateShareSlug returns the new slug directly (avoids stale session cache).
  let shareSlug = profile.shareSlug
  if (user && !shareSlug) {
    try {
      shareSlug = await generateShareSlug(user.id)
    } catch {
      // Non-fatal: card shows fallback state
    }
  }

  const [contacts, groups] = await Promise.all([getContacts(), getGroups()])

  const verifiedCount = contacts.filter(contact => Boolean(contact.verified_at) && !contact.opted_out).length
  const printCount = contacts.filter(contact => contact.delivery_method === 'print').length
  const digitalCount = contacts.filter(contact => contact.delivery_method === 'digital').length

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
      <div className="space-y-5">
        <section className="surface-panel px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Dashboard</p>
              <h1 className="mt-2 font-serif text-4xl text-ink">Contacts</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                Keep your list tidy, choose the right delivery method, and make sure each letter lands where it should.
              </p>
            </div>
            <SendVerificationButton />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Total</p>
              <p className="mt-2 font-serif text-3xl text-ink">{contacts.length}</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Verified</p>
              <p className="mt-2 font-serif text-3xl text-ink">{verifiedCount}</p>
            </div>
            <div className="rounded-[1.2rem] border border-border/80 bg-surface-raised px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Ready to send</p>
              <p className="mt-2 font-serif text-3xl text-ink">{printCount + digitalCount}</p>
            </div>
          </div>
        </section>

        <section className="surface-panel px-4 py-4 lg:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-ink">Your address book</h2>
              <p className="text-sm text-ink-muted">Delivery options are bigger here so it is easier to sort the list quickly.</p>
            </div>
          </div>
          <ContactTable contacts={contacts} allGroups={groups} />
        </section>
      </div>

      <aside className="space-y-5">
        <ShareLinkCard shareSlug={shareSlug} />

        <section className="surface-panel px-5 py-5">
          <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Delivery mix</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Print</span>
              <span className="font-serif text-2xl text-ink">{printCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Digital</span>
              <span className="font-serif text-2xl text-ink">{digitalCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
              <span className="font-medium text-ink">Handwrite</span>
              <span className="font-serif text-2xl text-ink">{contacts.filter(contact => contact.delivery_method === 'handwrite').length}</span>
            </div>
          </div>
        </section>

        <section className="surface-panel px-5 py-5">
          <h2 className="font-serif text-2xl text-ink">Schedule verification</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Send a check-in before your next mailing so the address book stays current.
          </p>
          <div className="mt-4">
            <ScheduleVerificationForm />
          </div>
        </section>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add ShareLinkCard to dashboard sidebar with lazy slug generation"
```

---

## Task 9: Add slug mini-form to Settings

**Files:**
- Modify: `components/profile-form.tsx`
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Add `shareSlug` prop and mini-form to `ProfileForm`**

The slug form is a separate `<form>` element rendered below the existing form. Replace the entire `components/profile-form.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, updateShareSlug } from '@/lib/actions/user'
import { slugSchema } from '@/lib/schemas'
import type { UserProfile } from '@/lib/user-profile'

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // --- Profile form state ---
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [senderName, setSenderName] = useState(profile.senderName ?? '')
  const [anniversaryReminders, setAnniversaryReminders] = useState(profile.anniversaryRemindersEnabled)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateProfile({
      full_name: fullName,
      bio: bio || undefined,
      sender_name: senderName || undefined,
      anniversary_reminders_enabled: anniversaryReminders,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  // --- Slug form state ---
  const [slug, setSlug] = useState(profile.shareSlug ?? '')
  const [slugError, setSlugError] = useState<string | null>(null)
  const [slugSaved, setSlugSaved] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)

  const slugUnchanged = slug.toLowerCase() === (profile.shareSlug ?? '')

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase()
    setSlug(val)
    setSlugError(null)
    setSlugSaved(false)
  }

  function validateSlugLocally(val: string): string | null {
    const result = slugSchema.safeParse(val)
    return result.success ? null : (result.error.errors[0]?.message ?? 'Invalid slug')
  }

  async function handleSlugSubmit(e: React.FormEvent) {
    e.preventDefault()
    const localErr = validateSlugLocally(slug)
    if (localErr) { setSlugError(localErr); return }

    setSlugLoading(true)
    setSlugError(null)
    setSlugSaved(false)

    const result = await updateShareSlug(slug)
    if (result.error === 'slug_taken') {
      setSlugError('That slug is already taken — try another')
    } else if (result.error) {
      setSlugError(result.error)
    } else {
      setSlugSaved(true)
      router.refresh()
    }
    setSlugLoading(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profile form */}
      <form onSubmit={handleSubmit} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm max-w-lg">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="full-name" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Display name</label>
          <input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} className="input min-h-11" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            Bio <span className="normal-case font-normal">(shown to recipients, 160 chars)</span>
          </label>
          <input
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={160}
            placeholder="e.g. Sending love from Portland, OR"
            className="input min-h-11"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sender-name" className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
            Sender name <span className="normal-case font-normal">(in email From: field)</span>
          </label>
          <input
            id="sender-name"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder={fullName || 'Your name'}
            className="input min-h-11"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={anniversaryReminders}
            onChange={e => setAnniversaryReminders(e.target.checked)}
            className="h-4 w-4"
          />
          Send me annual reminders to write again
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Profile saved.</p>}

        <button type="submit" disabled={loading} className="btn-primary min-h-11 max-w-[180px]">
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      {/* Slug mini-form */}
      <form onSubmit={handleSlugSubmit} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm max-w-lg">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-ink-muted">Share link slug</p>
          <p className="mt-1 text-sm text-ink-muted">
            This is the link you share with people. Changing it will break any previously shared links.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center rounded-[0.875rem] border border-border/80 bg-surface-raised px-3 min-h-11 gap-0">
            <span className="shrink-0 text-sm text-ink-muted select-none">{siteUrl}/share/</span>
            <input
              value={slug}
              onChange={handleSlugChange}
              onBlur={() => { if (slug) setSlugError(validateSlugLocally(slug)) }}
              placeholder="your-slug"
              className="flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink-muted/50"
              minLength={3}
              maxLength={30}
            />
          </div>
          {slugError && <p className="text-sm text-red-600">{slugError}</p>}
          {slugSaved && (
            <p className="text-sm text-green-600">
              Saved! Your new link: {siteUrl}/share/{slug}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={slugLoading || slugUnchanged}
          className="btn-primary min-h-11 max-w-[180px]"
        >
          {slugLoading ? 'Saving...' : 'Save slug'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Pass `shareSlug` to `ProfileForm` from the settings page**

In `app/dashboard/settings/page.tsx`, the `profile` object now has `shareSlug` from Task 2 — `ProfileForm` already accepts `profile: UserProfile`, so no change to the settings page is needed. The prop is part of `UserProfile` and flows through automatically.

Verify by reading the settings page — `profile` is passed as-is:
```tsx
<ProfileForm profile={profile} />
```

No change needed. ✓

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/profile-form.tsx
git commit -m "feat: add share link slug mini-form to settings"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run full typecheck and tests**

```bash
npm run typecheck && npm test
```

Expected: no TypeScript errors, all tests pass.

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Check:
1. `/dashboard` — Share link card appears in sidebar with a slug URL and copy button
2. `/dashboard/settings` — Slug mini-form appears below profile form, pre-filled with current slug
3. Change the slug, save — success message shows new URL
4. Visit `/share/[your-new-slug]` — address form loads correctly
5. Visit `/share/[your-uuid]` — address form still loads correctly (UUID route still works)
6. Visit `/share/nonexistent` — 404 page

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git add -p  # stage only intentional changes
git commit -m "chore: final cleanup after custom share link implementation"
```
