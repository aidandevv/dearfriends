# Social & Delight Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add admin profile (bio/sender name), warm thank-you page, note-back from recipients, letter templates, and address refresh nudge to NomadMail.

**Architecture:** Admin profile data lives in Supabase `user_metadata` (already used for `full_name`) — no new table needed. A new `note` column on `contacts` stores recipient notes. Letter templates are client-side constants. The nudge uses the existing Resend + verification-token pattern.

**Tech Stack:** Next.js App Router, Supabase (auth user_metadata + contacts table), Resend, React Hook Form, Zod, Tailwind/shadcn

---

## Task 1: DB Migration — add `note` column to contacts

**Files:**
- Create: `supabase/migrations/003_add_note_to_contacts.sql`

**Step 1: Write the migration**

```sql
-- Add note column for recipient note-back feature
alter table contacts add column note text;
```

**Step 2: Apply migration**

```bash
npx supabase db push
```
Or if using local dev: `npx supabase migration up`

**Step 3: Commit**

```bash
git add supabase/migrations/003_add_note_to_contacts.sql
git commit -m "feat: add note column to contacts for note-back feature"
```

---

## Task 2: Extend Admin Profile (bio + sender_name in user_metadata)

Profile data already lives in `user.user_metadata` (`full_name`, `has_seen_tour`). Add `bio` and `sender_name` to the same pattern.

**Files:**
- Modify: `lib/user-profile.ts`
- Modify: `lib/actions/user.ts`
- Modify: `lib/schemas.ts`

**Step 1: Update `UserProfile` type and reader in `lib/user-profile.ts`**

Add `bio` and `senderName` fields:

```ts
export type UserProfile = {
  fullName: string | null
  firstName: string | null
  bio: string | null
  senderName: string | null
  hasCompletedOnboarding: boolean
  hasSeenTour: boolean
}

export function getUserProfile(user: Pick<User, 'user_metadata'> | null | undefined): UserProfile {
  const metadata = user?.user_metadata ?? {}
  const fullName = readString(metadata.full_name)

  return {
    fullName,
    firstName: getFirstName(fullName),
    bio: readString(metadata.bio),
    senderName: readString(metadata.sender_name) ?? readString(metadata.full_name),
    hasCompletedOnboarding: Boolean(fullName),
    hasSeenTour: metadata.has_seen_tour === true,
  }
}
```

**Step 2: Add `updateProfile` server action to `lib/actions/user.ts`**

Read the existing file first, then add after `completeOnboarding`:

```ts
export async function updateProfile(data: { bio?: string; sender_name?: string; full_name?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ data })
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}
```

**Step 3: Add `profileSchema` to `lib/schemas.ts`**

```ts
export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(160).optional(),
  sender_name: z.string().trim().max(80).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
```

**Step 4: Commit**

```bash
git add lib/user-profile.ts lib/actions/user.ts lib/schemas.ts
git commit -m "feat: extend user profile with bio and sender_name fields"
```

---

## Task 3: Settings Page

**Files:**
- Create: `app/dashboard/settings/page.tsx`
- Create: `components/profile-form.tsx`

**Step 1: Create `components/profile-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/user'
import type { UserProfile } from '@/lib/user-profile'

export function ProfileForm({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [senderName, setSenderName] = useState(profile.senderName ?? '')
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
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="surface-panel flex flex-col gap-5 px-5 py-5 shadow-sm max-w-lg">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Display name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className="input min-h-11" required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          Bio <span className="normal-case font-normal">(shown to recipients, 160 chars)</span>
        </label>
        <input
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={160}
          placeholder="e.g. Sending love from Portland, OR"
          className="input min-h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">
          Sender name <span className="normal-case font-normal">(in email From: field)</span>
        </label>
        <input
          value={senderName}
          onChange={e => setSenderName(e.target.value)}
          placeholder={fullName || 'Your name'}
          className="input min-h-11"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Profile saved.</p>}

      <button type="submit" disabled={loading} className="btn-primary min-h-11 max-w-[180px]">
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
```

**Step 2: Create `app/dashboard/settings/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'
import { ProfileForm } from '@/components/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = getUserProfile(user)

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Settings</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">Your profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
          This name and bio appear on your address request page and in emails you send.
        </p>
      </section>

      <section className="surface-panel px-5 py-5">
        <ProfileForm profile={profile} />
      </section>
    </div>
  )
}
```

**Step 3: Add Settings link to dashboard nav in `components/site-shell.tsx`**

Open the file, find the nav links section, and add:
```tsx
<Link href="/dashboard/settings" className="...">Settings</Link>
```
Match the exact className pattern of the other nav links in that file.

**Step 4: Commit**

```bash
git add app/dashboard/settings/page.tsx components/profile-form.tsx components/site-shell.tsx
git commit -m "feat: add profile settings page with bio and sender name"
```

---

## Task 4: Warm Thank-You Page + Note-Back

**Files:**
- Modify: `app/(public)/share/[adminId]/page.tsx`
- Modify: `lib/actions/contacts.ts`
- Modify: `components/share-form.tsx`
- Modify: `lib/resend.ts`

**Step 1: Update `upsertContact` to return contact id**

In `lib/actions/contacts.ts`, change the upsert to select the returned id:

```ts
export async function upsertContact(adminId: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('contacts')
    .upsert({ ...parsed.data, admin_id: adminId }, { onConflict: 'admin_id,email' })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { success: true, contactId: data.id }
}
```

**Step 2: Add `submitNote` server action to `lib/actions/contacts.ts`**

```ts
export async function submitNote(contactId: string, note: string) {
  if (!note.trim()) return { success: true }
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('contacts')
    .update({ note: note.slice(0, 280) })
    .eq('id', contactId)
  if (error) return { error: error.message }
  return { success: true }
}
```

**Step 3: Add `buildNoteNotificationEmail` to `lib/resend.ts`**

```ts
export function buildNoteNotificationEmail(opts: {
  recipientFirstName: string
  note: string
  adminName: string | null
}): { subject: string; html: string } {
  return {
    subject: `${opts.recipientFirstName} left you a note`,
    html: `
      <p>Hi${opts.adminName ? ` ${opts.adminName}` : ''},</p>
      <p><strong>${opts.recipientFirstName}</strong> left you a note after submitting their address:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${opts.note}</blockquote>
    `,
  }
}
```

**Step 4: Add `notifyAdminOfNote` server action to `lib/actions/contacts.ts`**

```ts
export async function notifyAdminOfNote(opts: {
  adminId: string
  recipientFirstName: string
  note: string
}) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(opts.adminId)
  if (!user?.email) return

  const profile = getUserProfile(user)
  const { subject, html } = buildNoteNotificationEmail({
    recipientFirstName: opts.recipientFirstName,
    note: opts.note,
    adminName: profile.firstName,
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: user.email,
    subject,
    html,
  })
}
```

Add the necessary imports at top of `contacts.ts`:
```ts
import { getUserProfile } from '@/lib/user-profile'
import { getResend, buildNoteNotificationEmail } from '@/lib/resend'
```

**Step 5: Update `app/(public)/share/[adminId]/page.tsx` to pass bio**

```tsx
import { ShareForm } from '@/components/share-form'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export default async function SharePage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = await params
  const supabase = await createServiceClient()

  const { data } = await supabase.auth.admin.getUserById(adminId)
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

**Step 6: Update `components/share-form.tsx` with warm thank-you and note-back**

Replace the submitted state and add note handling. Key changes:

1. Add `senderBio` to props
2. Track `contactId` returned from `upsertContact`
3. Add note state: `note`, `noteSubmitting`, `noteSubmitted`
4. Replace the plain submitted state with the rich thank-you + note textarea

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail } from 'lucide-react'
import { upsertContact, submitNote, notifyAdminOfNote } from '@/lib/actions/contacts'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { Postmark } from '@/components/ui/postmark'

function firstName(name: string | null) {
  return name?.trim().split(/\s+/)[0] ?? null
}

export function ShareForm({
  adminId,
  senderName,
  senderBio,
}: {
  adminId: string
  senderName: string | null
  senderBio: string | null
}) {
  const [submitted, setSubmitted] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)
  const [recipientFirstName, setRecipientFirstName] = useState<string>('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)

  const displayName = useMemo(() => firstName(senderName) ?? senderName, [senderName])

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print' },
  })

  async function onSubmit(data: ContactInput) {
    const result = await upsertContact(adminId, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
      return
    }
    setRecipientFirstName(data.first_name)
    setContactId(result.contactId ?? null)
    setSubmitted(true)
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId || !note.trim()) return
    setNoteSubmitting(true)
    await submitNote(contactId, note)
    await notifyAdminOfNote({ adminId, recipientFirstName, note })
    setNoteSubmitting(false)
    setNoteSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-4 animate-fade-up">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Sealed &amp; sent.</h1>
          {displayName && (
            <div className="flex flex-col items-center gap-1">
              <p className="font-medium text-ink">{displayName}</p>
              {senderBio && <p className="text-sm text-ink-muted">{senderBio}</p>}
            </div>
          )}
          <p className="text-ink-muted text-sm leading-6">
            {displayName
              ? `Thanks, ${recipientFirstName}! Your address is saved. ${displayName} can't wait to send you something.`
              : 'Your address has been saved. Expect something special in the mail.'}
          </p>

          {contactId && !noteSubmitted && (
            <form onSubmit={handleNoteSubmit} className="w-full surface-panel px-4 py-4 flex flex-col gap-3">
              <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted text-left">
                Leave a note for {displayName ?? 'them'} (optional)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 280))}
                rows={3}
                placeholder={`Leave a note for ${displayName ?? 'them'}...`}
                className="input resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted">{note.length}/280</span>
                <button
                  type="submit"
                  disabled={noteSubmitting || !note.trim()}
                  className="btn-primary min-h-9 px-4 text-sm"
                >
                  {noteSubmitting ? 'Sending...' : 'Send note'}
                </button>
              </div>
            </form>
          )}

          {noteSubmitted && (
            <p className="text-sm text-ink-muted">Note sent ✓</p>
          )}
        </div>
      </main>
    )
  }

  // ... existing form JSX unchanged below this point
```

> **Note:** Keep the existing form JSX (the `<main>` with the address fields) exactly as is. Only replace the `if (submitted)` block and add the new state/handlers above.

**Step 7: Commit**

```bash
git add app/(public)/share/[adminId]/page.tsx components/share-form.tsx lib/actions/contacts.ts lib/resend.ts
git commit -m "feat: warm thank-you page with bio, note-back, and admin notification"
```

---

## Task 5: Letter Templates

**Files:**
- Create: `lib/letter-templates.ts`
- Create: `components/template-picker.tsx`
- Modify: `components/letter-composer.tsx`

**Step 1: Create `lib/letter-templates.ts`**

```ts
export type LetterTemplate = {
  id: string
  name: string
  defaultBody: string
  accentColor: string
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'holiday',
    name: 'Holiday',
    accentColor: '#8B4513',
    defaultBody: `# Happy Holidays, {{first_name}}!

What a year it's been. I've been thinking about you and wanted to take a moment to send some warmth your way.

Wishing you and yours a season full of joy, rest, and good company.

With love,
[Your name]`,
  },
  {
    id: 'summer',
    name: 'Summer',
    accentColor: '#D2691E',
    defaultBody: `# Hey {{first_name}}!

Summer's here and I wanted to say hi. Hope life is treating you well and you're getting some sun.

Thinking of you from afar. Let's catch up soon.

Warmly,
[Your name]`,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    accentColor: '#9B59B6',
    defaultBody: `# Happy Birthday, {{first_name}}!

Just wanted to take a moment to celebrate you today. Hope this year brings you everything you've been hoping for.

Cheers to you!
[Your name]`,
  },
  {
    id: 'evergreen',
    name: 'Evergreen',
    accentColor: '#2E8B57',
    defaultBody: `# Hi {{first_name}},

I've been meaning to write for a while. Life gets busy, but I didn't want too much time to pass without reaching out.

Hope all is well on your end. Sending good thoughts your way.

Take care,
[Your name]`,
  },
]
```

**Step 2: Create `components/template-picker.tsx`**

```tsx
'use client'

import { LETTER_TEMPLATES, type LetterTemplate } from '@/lib/letter-templates'

export function TemplatePicker({
  onSelect,
}: {
  onSelect: (template: LetterTemplate) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {LETTER_TEMPLATES.map(template => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5 rounded-[1rem] border border-border/80 bg-surface-raised px-3 py-2.5 text-left hover:border-terra/40 transition-colors"
        >
          <span
            className="h-3 w-10 rounded-full"
            style={{ backgroundColor: template.accentColor }}
          />
          <span className="text-xs font-medium text-ink">{template.name}</span>
        </button>
      ))}
    </div>
  )
}
```

**Step 3: Integrate TemplatePicker into `components/letter-composer.tsx`**

Near the top of the file, add the import:
```tsx
import { TemplatePicker } from '@/components/template-picker'
import type { LetterTemplate } from '@/lib/letter-templates'
```

Inside the component, add a handler:
```tsx
function handleTemplateSelect(template: LetterTemplate) {
  const hasContent = body.trim().length > 0
  if (hasContent) {
    const confirmed = window.confirm('Replace your current draft with this template?')
    if (!confirmed) return
  }
  setBody(template.defaultBody)
  triggerSave(subject, template.defaultBody)
}
```

In the JSX, add the picker above the body textarea (after the subject input, before the body textarea):
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">Templates</label>
  <TemplatePicker onSelect={handleTemplateSelect} />
</div>
```

**Step 4: Commit**

```bash
git add lib/letter-templates.ts components/template-picker.tsx components/letter-composer.tsx
git commit -m "feat: letter templates with seasonal themes"
```

---

## Task 6: Address Refresh Nudge

**Files:**
- Modify: `lib/resend.ts`
- Modify: `lib/actions/contacts.ts`
- Modify: `components/contact-table.tsx`

**Step 1: Add `buildAddressRefreshEmail` to `lib/resend.ts`**

```ts
export function buildAddressRefreshEmail(opts: {
  firstName: string
  refreshUrl: string
  adminName: string | null
}): { subject: string; html: string } {
  const from = opts.adminName ?? 'Someone'
  return {
    subject: `${from} wants to confirm your address`,
    html: `
      <p>Hi ${opts.firstName},</p>
      <p>${from} is updating their address book and wants to make sure they have your current address.</p>
      <p>Mind taking 30 seconds to confirm (or update) it?</p>
      <p><a href="${opts.refreshUrl}" style="background:#8B4513;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Confirm my address</a></p>
      <p style="font-size:12px;color:#999">This link is unique to you.</p>
    `,
  }
}
```

**Step 2: Add `sendAddressRefreshNudge` server action to `lib/actions/contacts.ts`**

```ts
export async function sendAddressRefreshNudge(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, first_name, verification_token')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) return { error: 'Contact not found.' }

  // Reuse existing verification token pattern for the refresh link
  const token = randomUUID()
  const { error: tokenError } = await supabase
    .from('contacts')
    .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
    .eq('id', contactId)

  if (tokenError) return { error: tokenError.message }

  const senderProfile = getUserProfile(user)
  const { subject, html } = buildAddressRefreshEmail({
    firstName: contact.first_name,
    refreshUrl: `${SITE_URL}/verify/${token}`,
    adminName: senderProfile.fullName,
  })

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: contact.email,
    subject,
    html,
  })

  if (result.error) return { error: result.error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
```

Add `import { randomUUID } from 'crypto'` if not already present (check top of file).

**Step 3: Add nudge button to `components/contact-table.tsx`**

Read the file, find the per-row action area (delete button, delivery method toggle, etc.), and add a "Nudge address" button:

```tsx
import { sendAddressRefreshNudge } from '@/lib/actions/contacts'

// Inside the row actions area:
<button
  onClick={async () => {
    await sendAddressRefreshNudge(contact.id)
  }}
  className="text-xs text-ink-muted hover:text-ink underline"
  title="Send address refresh nudge"
>
  Nudge
</button>
```

Match the exact pattern of other action buttons in that file.

**Step 4: Commit**

```bash
git add lib/resend.ts lib/actions/contacts.ts components/contact-table.tsx
git commit -m "feat: address refresh nudge email with per-contact trigger"
```

---

## Task 7: Smoke Test Everything

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Test each feature manually**

- [ ] Go to `/onboarding` — complete with name (and bio if added to onboarding form)
- [ ] Go to `/dashboard/settings` — update bio and sender name, verify save
- [ ] Go to `/share/[your-admin-id]` — submit address, verify warm thank-you shows name + bio
- [ ] On thank-you page — submit a note, verify "Note sent ✓" appears
- [ ] Check Supabase dashboard — confirm `note` column populated on the contact
- [ ] Check email inbox — verify admin note notification arrived
- [ ] Go to `/dashboard/compose` — verify template picker appears, click each template, confirm content loads
- [ ] On dashboard — click "Nudge" on a contact, check email arrives with correct link
- [ ] Follow nudge link to `/verify/[token]` — confirm address update flow works

**Step 3: Fix any issues found, then final commit**

```bash
git add -A
git commit -m "fix: address any smoke test issues"
```

---

## Notes & Scope Limits

- **Avatar upload** is intentionally out of scope — add later with Supabase Storage when needed
- **Bulk nudge** (checkbox-select multiple contacts) is out of scope for this plan — add as a follow-up
- **Annual auto-nudge cron** is out of scope — the existing `/api/cron/send-verifications` pattern can be extended later
- The `note` column on contacts is visible in the Supabase dashboard; a UI to display it in the contact table can be added as a follow-up
