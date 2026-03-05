# NomadMail MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build NomadMail — a Next.js 15 app for collecting mailing addresses, managing contacts, composing personalized letters, and sending them via Resend.

**Architecture:** Server Components + Server Actions throughout. Supabase SSR client for all DB access. Resend handles verification emails and digital letter sends. One Vercel cron job for scheduled verification batches.

**Tech Stack:** Next.js 15 (App Router, TypeScript strict), Supabase (Postgres + magic link auth), Tailwind CSS, shadcn/ui, React Hook Form + Zod, Resend, @react-pdf/renderer, react-markdown, Vitest

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `.env.local`, `.env.example`, `.gitignore`

**Step 1: Run create-next-app**

```bash
cd /Users/aidan/dev/dearfriends
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: Next.js 15 project scaffolded in current directory.

**Step 2: Install dependencies**

```bash
pnpm add @supabase/ssr @supabase/supabase-js resend @react-pdf/renderer react-markdown react-hook-form @hookform/resolvers zod
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: Configure Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 4: Set up environment variables**

Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
CRON_SECRET=
```

Create `.env.local` from `.env.example` and fill in your Supabase project values and Resend API key. Set `CRON_SECRET` to any random string.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with dependencies"
```

---

## Task 2: Supabase client utilities

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`

**Step 1: Create server client**

Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Step 2: Create browser client**

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase server and browser client utilities"
```

---

## Task 3: Database migration

**Files:**
- Create: `supabase/migrations/001_initial.sql`

**Step 1: Write migration**

Create `supabase/migrations/001_initial.sql`:
```sql
-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Contacts
create table contacts (
  id                   uuid primary key default gen_random_uuid(),
  admin_id             uuid not null references auth.users(id) on delete cascade,
  first_name           text not null,
  last_name            text not null,
  email                text not null,
  address_line_1       text not null,
  address_line_2       text,
  city                 text not null,
  state                text not null,
  zip                  text not null,
  tags                 text[] not null default '{}',
  delivery_method      text not null default 'print',
  opted_out            boolean not null default false,
  verification_token   uuid,
  verification_sent_at timestamptz,
  verified_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (admin_id, email)
);

-- Letter drafts (one per admin, upserted)
create table letter_drafts (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id) on delete cascade unique,
  subject    text not null default '',
  body       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Scheduled verification sends
create table scheduled_verifications (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references auth.users(id) on delete cascade,
  send_at    timestamptz not null,
  sent       boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table contacts enable row level security;
alter table letter_drafts enable row level security;
alter table scheduled_verifications enable row level security;

-- contacts: admin CRUD
create policy "admin_select" on contacts for select using (auth.uid() = admin_id);
create policy "admin_insert" on contacts for insert with check (auth.uid() = admin_id);
create policy "admin_update" on contacts for update using (auth.uid() = admin_id);
create policy "admin_delete" on contacts for delete using (auth.uid() = admin_id);

-- contacts: public insert via share form (admin_id must be valid user)
create policy "public_share_insert" on contacts for insert
  with check (
    admin_id in (select id from auth.users)
  );

-- contacts: public update via verify token (no auth)
create policy "public_verify_update" on contacts for update
  using (verification_token is not null)
  with check (verification_token is not null);

-- letter_drafts: admin only
create policy "admin_all" on letter_drafts for all using (auth.uid() = admin_id);

-- scheduled_verifications: admin only
create policy "admin_all" on scheduled_verifications for all using (auth.uid() = admin_id);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger contacts_updated_at before update on contacts
  for each row execute function update_updated_at();

create trigger letter_drafts_updated_at before update on letter_drafts
  for each row execute function update_updated_at();
```

**Step 2: Apply migration**

Run this SQL in your Supabase project dashboard → SQL editor. Paste and run the full file.

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database migration with RLS"
```

---

## Task 4: Middleware and auth routes

**Files:**
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/auth/callback/route.ts`

**Step 1: Write middleware**

Create `middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

**Step 2: Write login page**

Create `app/(auth)/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-600">Check your email for a magic link.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
    </main>
  )
}
```

**Step 3: Write auth callback route**

Create `app/(auth)/auth/callback/route.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

**Step 4: Verify manually**

Start dev server: `pnpm dev`

Visit `http://localhost:3000/login`. Submit your email. Check inbox for magic link. Clicking it should redirect to `/dashboard` (which will 404 until Task 6 — that's fine).

Visiting `/dashboard` without being logged in should redirect to `/login`.

**Step 5: Commit**

```bash
git add middleware.ts app/
git commit -m "feat: add magic link auth and middleware protection"
```

---

## Task 5: Utility functions (tested)

**Files:**
- Create: `lib/utils.ts`
- Create: `lib/utils.test.ts`

**Step 1: Write failing tests**

Create `lib/utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { interpolate, formatCsvRow, toCsv } from './utils'

describe('interpolate', () => {
  it('replaces known variables', () => {
    expect(interpolate('Dear {{first_name}} {{last_name}},', { first_name: 'Ada', last_name: 'Lovelace' }))
      .toBe('Dear Ada Lovelace,')
  })

  it('leaves unknown variables intact', () => {
    expect(interpolate('Hello {{unknown}}', { first_name: 'Ada', last_name: 'B' }))
      .toBe('Hello {{unknown}}')
  })

  it('handles empty body', () => {
    expect(interpolate('', { first_name: 'A', last_name: 'B' })).toBe('')
  })
})

describe('toCsv', () => {
  it('produces header + data rows', () => {
    const rows = [{ first_name: 'Ada', last_name: 'L', address_line_1: '1 Main St', address_line_2: '', city: 'NY', state: 'NY', zip: '10001' }]
    const csv = toCsv(rows)
    expect(csv).toContain('First Name')
    expect(csv).toContain('Ada')
    expect(csv).toContain('1 Main St')
  })

  it('escapes commas in fields', () => {
    const rows = [{ first_name: 'A,B', last_name: 'L', address_line_1: '1 Main', address_line_2: '', city: 'NY', state: 'NY', zip: '10001' }]
    expect(toCsv(rows)).toContain('"A,B"')
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
pnpm test
```

Expected: FAIL — `interpolate` and `toCsv` not defined.

**Step 3: Implement utilities**

Create `lib/utils.ts`:
```ts
export function interpolate(
  body: string,
  vars: { first_name: string; last_name: string }
): string {
  return body
    .replace(/\{\{first_name\}\}/g, vars.first_name)
    .replace(/\{\{last_name\}\}/g, vars.last_name)
}

type CsvContact = {
  first_name: string
  last_name: string
  address_line_1: string
  address_line_2: string | null | undefined
  city: string
  state: string
  zip: string
}

function formatCsvField(value: string | null | undefined): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function formatCsvRow(fields: (string | null | undefined)[]): string {
  return fields.map(formatCsvField).join(',')
}

export function toCsv(contacts: CsvContact[]): string {
  const header = formatCsvRow([
    'First Name', 'Last Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'ZIP',
  ])
  const rows = contacts.map(c =>
    formatCsvRow([c.first_name, c.last_name, c.address_line_1, c.address_line_2, c.city, c.state, c.zip])
  )
  return [header, ...rows].join('\n')
}
```

**Step 4: Run tests to confirm they pass**

```bash
pnpm test
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/utils.ts lib/utils.test.ts
git commit -m "feat: add interpolate and CSV utility functions with tests"
```

---

## Task 6: Zod schemas

**Files:**
- Create: `lib/schemas.ts`
- Create: `lib/schemas.test.ts`

**Step 1: Write failing tests**

Create `lib/schemas.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { contactSchema, letterDraftSchema } from './schemas'

describe('contactSchema', () => {
  const valid = {
    first_name: 'Ada', last_name: 'L', email: 'a@b.com',
    address_line_1: '1 Main', city: 'NY', state: 'NY', zip: '10001',
    delivery_method: 'print',
  }

  it('accepts valid contact', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })

  it('rejects invalid delivery_method', () => {
    expect(contactSchema.safeParse({ ...valid, delivery_method: 'fax' }).success).toBe(false)
  })
})

describe('letterDraftSchema', () => {
  it('accepts valid draft', () => {
    expect(letterDraftSchema.safeParse({ subject: 'Hello', body: '# Hi' }).success).toBe(true)
  })

  it('rejects empty subject', () => {
    expect(letterDraftSchema.safeParse({ subject: '', body: 'hi' }).success).toBe(false)
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
pnpm test
```

Expected: FAIL.

**Step 3: Implement schemas**

Create `lib/schemas.ts`:
```ts
import { z } from 'zod'

export const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  delivery_method: z.enum(['handwrite', 'print', 'digital']),
  tags: z.array(z.string()).optional().default([]),
})

export type ContactInput = z.infer<typeof contactSchema>

export const letterDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
})

export type LetterDraftInput = z.infer<typeof letterDraftSchema>

export const verifySchema = z.object({
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
})

export const scheduleVerificationSchema = z.object({
  send_at: z.string().min(1),
})
```

**Step 4: Run tests**

```bash
pnpm test
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add lib/schemas.ts lib/schemas.test.ts
git commit -m "feat: add Zod schemas for contacts, letter drafts, and verification"
```

---

## Task 7: Server actions — contacts

**Files:**
- Create: `lib/actions/contacts.ts`

**Step 1: Implement contact actions**

Create `lib/actions/contacts.ts`:
```ts
'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { contactSchema } from '@/lib/schemas'
import { revalidatePath } from 'next/cache'

export async function upsertContact(adminId: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('contacts')
    .upsert({ ...parsed.data, admin_id: adminId }, { onConflict: 'admin_id,email' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getContacts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function updateContact(id: string, updates: Partial<{
  delivery_method: string
  tags: string[]
  opted_out: boolean
}>) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteContact(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}
```

**Step 2: Commit**

```bash
git add lib/actions/contacts.ts
git commit -m "feat: add contact server actions (upsert, get, update, delete)"
```

---

## Task 8: Public share form

**Files:**
- Create: `app/(public)/share/[adminId]/page.tsx`

**Step 1: Implement share page**

Create `app/(public)/share/[adminId]/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { upsertContact } from '@/lib/actions/contacts'

export default function SharePage({ params }: { params: Promise<{ adminId: string }> }) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { delivery_method: 'print' },
  })

  async function onSubmit(data: ContactInput) {
    const { adminId } = await params
    const result = await upsertContact(adminId, data)
    if (result.error) {
      setServerError(typeof result.error === 'string' ? result.error : 'Something went wrong.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-2">Thanks!</h1>
          <p className="text-sm text-gray-600">Your address has been saved.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md w-full flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Share your address</h1>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <input {...register('first_name')} placeholder="First name" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <input {...register('last_name')} placeholder="Last name" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <input {...register('email')} type="email" placeholder="Email" className="border rounded px-3 py-2 text-sm w-full" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input {...register('address_line_1')} placeholder="Address line 1" className="border rounded px-3 py-2 text-sm w-full" />
          {errors.address_line_1 && <p className="text-xs text-red-500 mt-1">{errors.address_line_1.message}</p>}
        </div>

        <input {...register('address_line_2')} placeholder="Address line 2 (optional)" className="border rounded px-3 py-2 text-sm w-full" />

        <div className="grid grid-cols-3 gap-3">
          <div>
            <input {...register('city')} placeholder="City" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
          </div>
          <div>
            <input {...register('state')} placeholder="State" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <input {...register('zip')} placeholder="ZIP" className="border rounded px-3 py-2 text-sm w-full" />
            {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Submit'}
        </button>
      </form>
    </main>
  )
}
```

**Step 2: Manual test**

- Get your Supabase user ID from the Supabase dashboard → Authentication → Users
- Visit `http://localhost:3000/share/<your-user-id>`
- Submit the form
- Check Supabase → Table Editor → contacts to confirm the row was inserted

**Step 3: Commit**

```bash
git add app/
git commit -m "feat: add public address collection share form"
```

---

## Task 9: Dashboard layout and contact table

**Files:**
- Create: `app/dashboard/layout.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `components/contact-table.tsx`

**Step 1: Create dashboard layout with sidebar**

Create `app/dashboard/layout.tsx`:
```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`

  return (
    <div className="flex min-h-screen">
      <nav className="w-52 border-r bg-gray-50 flex flex-col gap-1 p-4 text-sm">
        <p className="font-semibold mb-3">NomadMail</p>
        <Link href="/dashboard" className="hover:underline">Contacts</Link>
        <Link href="/dashboard/compose" className="hover:underline">Compose</Link>
        <Link href="/dashboard/export" className="hover:underline">Export & Send</Link>
        <div className="mt-auto pt-4 border-t">
          <p className="text-xs text-gray-500 mb-1">Your share link:</p>
          <a href={shareUrl} className="text-xs text-blue-600 break-all" target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
        </div>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` to `.env.local`.

**Step 2: Create contact table component**

Create `components/contact-table.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { updateContact, deleteContact } from '@/lib/actions/contacts'

type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  city: string
  state: string
  delivery_method: string
  opted_out: boolean
  verified_at: string | null
  tags: string[]
}

export function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [pending, setPending] = useState<string | null>(null)

  async function handleDeliveryChange(id: string, value: string) {
    setPending(id)
    await updateContact(id, { delivery_method: value })
    setPending(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return
    setPending(id)
    await deleteContact(id)
    setPending(null)
  }

  if (contacts.length === 0) {
    return <p className="text-sm text-gray-500">No contacts yet. Share your link to collect addresses.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Email</th>
            <th className="pb-2 pr-4">Location</th>
            <th className="pb-2 pr-4">Delivery</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="py-2 pr-4">{c.first_name} {c.last_name}</td>
              <td className="py-2 pr-4 text-gray-600">{c.email}</td>
              <td className="py-2 pr-4 text-gray-600">{c.city}, {c.state}</td>
              <td className="py-2 pr-4">
                <select
                  value={c.delivery_method}
                  disabled={pending === c.id}
                  onChange={e => handleDeliveryChange(c.id, e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="handwrite">Handwrite</option>
                  <option value="print">Print</option>
                  <option value="digital">Digital</option>
                </select>
              </td>
              <td className="py-2 pr-4 text-xs text-gray-500">
                {c.opted_out ? 'Opted out' : c.verified_at ? 'Verified' : 'Unverified'}
              </td>
              <td className="py-2">
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={pending === c.id}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 3: Create dashboard page**

Create `app/dashboard/page.tsx`:
```tsx
import { getContacts } from '@/lib/actions/contacts'
import { ContactTable } from '@/components/contact-table'
import { SendVerificationButton } from '@/components/send-verification-button'
import { ScheduleVerificationForm } from '@/components/schedule-verification-form'

export default async function DashboardPage() {
  const contacts = await getContacts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex gap-2">
          <SendVerificationButton />
        </div>
      </div>
      <ContactTable contacts={contacts} />
      <div className="mt-8 border-t pt-6">
        <h2 className="text-sm font-semibold mb-3">Schedule Verification</h2>
        <ScheduleVerificationForm />
      </div>
    </div>
  )
}
```

Note: `SendVerificationButton` and `ScheduleVerificationForm` are created in Task 10.

**Step 4: Commit**

```bash
git add app/dashboard/ components/
git commit -m "feat: add dashboard layout, sidebar, and contact table"
```

---

## Task 10: Resend client and verification flow

**Files:**
- Create: `lib/resend.ts`
- Create: `lib/actions/verification.ts`
- Create: `components/send-verification-button.tsx`
- Create: `components/schedule-verification-form.tsx`
- Create: `app/(public)/verify/[token]/page.tsx`
- Create: `app/api/cron/send-verifications/route.ts`

**Step 1: Create Resend client**

Create `lib/resend.ts`:
```ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export function buildVerificationEmail(opts: {
  firstName: string
  verifyUrl: string
}): { subject: string; html: string } {
  return {
    subject: 'Please verify your address',
    html: `
      <p>Hi ${opts.firstName},</p>
      <p>Please confirm your mailing address (or update it / opt out) using the link below:</p>
      <p><a href="${opts.verifyUrl}">Verify / Update / Opt out</a></p>
      <p>This link is unique to you.</p>
    `,
  }
}

export function buildLetterEmail(opts: {
  subject: string
  body: string
}): { subject: string; html: string } {
  // Simple markdown-to-plain-text conversion for email body
  // (react-markdown is for browser; use simple replacement for server-side email)
  const htmlBody = opts.body
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
  return {
    subject: opts.subject,
    html: `<p>${htmlBody}</p>`,
  }
}
```

**Step 2: Create verification actions**

Create `lib/actions/verification.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { resend, buildVerificationEmail } from '@/lib/resend'
import { revalidatePath } from 'next/cache'
import { scheduleVerificationSchema, verifySchema } from '@/lib/schemas'
import { randomUUID } from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendVerificationToAll() {
  const supabase = await createClient()
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, email, first_name')
    .eq('opted_out', false)

  if (error) return { error: error.message }
  if (!contacts?.length) return { error: 'No eligible contacts.' }

  for (const contact of contacts) {
    const token = randomUUID()
    await supabase
      .from('contacts')
      .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
      .eq('id', contact.id)

    const { subject, html } = buildVerificationEmail({
      firstName: contact.first_name,
      verifyUrl: `${SITE_URL}/verify/${token}`,
    })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: contact.email,
      subject,
      html,
    })
  }

  return { success: true, count: contacts.length }
}

export async function scheduleVerification(formData: FormData) {
  const parsed = scheduleVerificationSchema.safeParse({
    send_at: formData.get('send_at'),
  })
  if (!parsed.success) return { error: 'Invalid date.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('scheduled_verifications').insert({
    admin_id: user.id,
    send_at: parsed.data.send_at,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  return { success: true }
}

export async function handleVerifyToken(
  token: string,
  action: 'confirm' | 'update' | 'optout',
  updates?: { address_line_1: string; address_line_2?: string; city: string; state: string; zip: string }
) {
  const supabase = await createClient()

  if (action === 'optout') {
    const { error } = await supabase
      .from('contacts')
      .update({ opted_out: true, verification_token: null })
      .eq('verification_token', token)
    return error ? { error: error.message } : { success: true }
  }

  if (action === 'confirm') {
    const { error } = await supabase
      .from('contacts')
      .update({ verified_at: new Date().toISOString(), verification_token: null })
      .eq('verification_token', token)
    return error ? { error: error.message } : { success: true }
  }

  if (action === 'update' && updates) {
    const parsed = verifySchema.safeParse(updates)
    if (!parsed.success) return { error: 'Invalid address.' }
    const { error } = await supabase
      .from('contacts')
      .update({ ...parsed.data, verified_at: new Date().toISOString(), verification_token: null })
      .eq('verification_token', token)
    return error ? { error: error.message } : { success: true }
  }

  return { error: 'Unknown action.' }
}
```

**Step 3: Create send verification button**

Create `components/send-verification-button.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { sendVerificationToAll } from '@/lib/actions/verification'

export function SendVerificationButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!confirm('Send verification emails to all non-opted-out contacts?')) return
    setLoading(true)
    const result = await sendVerificationToAll()
    setStatus(result.error ? `Error: ${result.error}` : `Sent to ${(result as { count?: number }).count} contacts.`)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      {status && <p className="text-xs text-gray-600">{status}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Verification'}
      </button>
    </div>
  )
}
```

**Step 4: Create schedule verification form**

Create `components/schedule-verification-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'

export function ScheduleVerificationForm() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await scheduleVerification(formData)
    setStatus(result.error ? `Error: ${result.error}` : 'Scheduled.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Send at</label>
        <input type="datetime-local" name="send_at" required className="border rounded px-3 py-1.5 text-sm" />
      </div>
      <button type="submit" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
        Schedule
      </button>
      {status && <p className="text-xs text-gray-600">{status}</p>}
    </form>
  )
}
```

**Step 5: Create verify page**

Create `app/(public)/verify/[token]/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { handleVerifyToken } from '@/lib/actions/verification'

// Add VerifyInput type export to lib/schemas.ts:
// export type VerifyInput = z.infer<typeof verifySchema>

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(verifySchema),
  })

  async function handleConfirm() {
    const { token } = await params
    await handleVerifyToken(token, 'confirm')
    setDone('confirmed')
  }

  async function handleOptOut() {
    if (!confirm('Are you sure you want to opt out?')) return
    const { token } = await params
    await handleVerifyToken(token, 'optout')
    setDone('optedout')
  }

  async function onUpdate(data: Record<string, string>) {
    const { token } = await params
    await handleVerifyToken(token, 'update', data as Parameters<typeof handleVerifyToken>[2])
    setDone('updated')
  }

  if (done) {
    const messages = {
      confirmed: 'Your address is confirmed. Thanks!',
      updated: 'Your address has been updated. Thanks!',
      optedout: "You've been opted out. You won't receive further mailings.",
    }
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-gray-600">{messages[done]}</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold mb-4">Verify your address</h1>

        {!editing ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Is your address still correct?</p>
            <button onClick={handleConfirm} className="bg-black text-white rounded px-4 py-2 text-sm">
              Yes, confirm
            </button>
            <button onClick={() => setEditing(true)} className="border rounded px-4 py-2 text-sm">
              No, update my address
            </button>
            <button onClick={handleOptOut} className="text-sm text-red-500 hover:underline text-left mt-2">
              Opt out of future mailings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-3">
            <input {...register('address_line_1')} placeholder="Address line 1" className="border rounded px-3 py-2 text-sm" />
            {errors.address_line_1 && <p className="text-xs text-red-500">{String(errors.address_line_1.message)}</p>}
            <input {...register('address_line_2')} placeholder="Address line 2 (optional)" className="border rounded px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input {...register('city')} placeholder="City" className="border rounded px-3 py-2 text-sm" />
              <input {...register('state')} placeholder="State" className="border rounded px-3 py-2 text-sm" />
              <input {...register('zip')} placeholder="ZIP" className="border rounded px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={isSubmitting} className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50">
              {isSubmitting ? 'Saving…' : 'Update address'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
```

Also add to `lib/schemas.ts`:
```ts
export type VerifyInput = z.infer<typeof verifySchema>
```

**Step 6: Create cron endpoint**

Create `app/api/cron/send-verifications/route.ts`:
```ts
import { createServiceClient } from '@/lib/supabase/server'
import { resend, buildVerificationEmail } from '@/lib/resend'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // Find due schedules
  const { data: schedules } = await supabase
    .from('scheduled_verifications')
    .select('id, admin_id')
    .lte('send_at', new Date().toISOString())
    .eq('sent', false)

  if (!schedules?.length) return NextResponse.json({ ok: true, sent: 0 })

  let totalSent = 0

  for (const schedule of schedules) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email, first_name')
      .eq('admin_id', schedule.admin_id)
      .eq('opted_out', false)

    if (!contacts?.length) continue

    for (const contact of contacts) {
      const token = randomUUID()
      await supabase
        .from('contacts')
        .update({ verification_token: token, verification_sent_at: new Date().toISOString() })
        .eq('id', contact.id)

      const { subject, html } = buildVerificationEmail({
        firstName: contact.first_name,
        verifyUrl: `${SITE_URL}/verify/${token}`,
      })

      await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
      totalSent++
    }

    await supabase.from('scheduled_verifications').update({ sent: true }).eq('id', schedule.id)
  }

  return NextResponse.json({ ok: true, sent: totalSent })
}
```

Add to `vercel.json` (create it):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-verifications",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Step 7: Commit**

```bash
git add lib/ components/ app/ vercel.json
git commit -m "feat: add verification email flow, verify page, and cron endpoint"
```

---

## Task 11: Letter actions and PDF

**Files:**
- Create: `lib/actions/letter.ts`
- Create: `lib/pdf.ts`

**Step 1: Create letter actions**

Create `lib/actions/letter.ts`:
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { letterDraftSchema } from '@/lib/schemas'
import { resend, buildLetterEmail } from '@/lib/resend'
import { interpolate } from '@/lib/utils'
import { revalidatePath } from 'next/cache'

export async function getDraft() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('letter_drafts')
    .select('*')
    .single()
  return data ?? { subject: '', body: '' }
}

export async function saveDraft(formData: { subject: string; body: string }) {
  const parsed = letterDraftSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('letter_drafts')
    .upsert({ admin_id: user.id, ...parsed.data }, { onConflict: 'admin_id' })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/compose')
  return { success: true }
}

export async function sendDigitalLetters() {
  const supabase = await createClient()

  const [{ data: draft }, { data: contacts }] = await Promise.all([
    supabase.from('letter_drafts').select('*').single(),
    supabase.from('contacts').select('*').eq('delivery_method', 'digital').eq('opted_out', false),
  ])

  if (!draft?.subject || !draft?.body) return { error: 'No draft saved.' }
  if (!contacts?.length) return { error: 'No digital contacts.' }

  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  for (const contact of contacts) {
    const body = interpolate(draft.body, { first_name: contact.first_name, last_name: contact.last_name })
    const subject = interpolate(draft.subject, { first_name: contact.first_name, last_name: contact.last_name })
    const { html } = buildLetterEmail({ subject, body })
    await resend.emails.send({ from: FROM_EMAIL, to: contact.email, subject, html })
  }

  return { success: true, count: contacts.length }
}

export async function getRandomContact() {
  const supabase = await createClient()
  const { data } = await supabase.from('contacts').select('first_name, last_name').limit(10)
  if (!data?.length) return { first_name: 'Jane', last_name: 'Smith' }
  return data[Math.floor(Math.random() * data.length)]
}
```

**Step 2: Create PDF utility**

Create `lib/pdf.ts`:
```ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import { interpolate } from './utils'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.6 },
  body: { whiteSpace: 'pre-wrap' as const },
})

function LetterDocument({ pages }: { pages: { name: string; body: string }[] }) {
  return createElement(Document, null,
    ...pages.map((page, i) =>
      createElement(Page, { key: i, size: 'A4', style: styles.page },
        createElement(View, { style: styles.body },
          createElement(Text, null, page.body)
        )
      )
    )
  )
}

export async function generateLetterPdf(contacts: { first_name: string; last_name: string }[], body: string): Promise<Buffer> {
  const pages = contacts.map(c => ({
    name: `${c.first_name} ${c.last_name}`,
    body: interpolate(body, { first_name: c.first_name, last_name: c.last_name }),
  }))

  const doc = createElement(LetterDocument, { pages })
  const stream = await pdf(doc).toBuffer()
  return stream
}
```

**Step 3: Commit**

```bash
git add lib/actions/letter.ts lib/pdf.ts
git commit -m "feat: add letter server actions and PDF generation utility"
```

---

## Task 12: Letter composer page

**Files:**
- Create: `app/dashboard/compose/page.tsx`
- Create: `components/letter-composer.tsx`

**Step 1: Create composer component**

Create `components/letter-composer.tsx`:
```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveDraft } from '@/lib/actions/letter'
import { interpolate } from '@/lib/utils'

type Props = {
  initialSubject: string
  initialBody: string
  previewContact: { first_name: string; last_name: string }
}

export function LetterComposer({ initialSubject, initialBody, previewContact }: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function triggerSave(s: string, b: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!s.trim()) return
      setSaving(true)
      await saveDraft({ subject: s, body: b })
      setSaving(false)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1000)
  }

  function handleSubjectChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubject(e.target.value)
    triggerSave(e.target.value, body)
  }

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value)
    triggerSave(subject, e.target.value)
  }

  const previewBody = interpolate(body, previewContact)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          value={subject}
          onChange={handleSubjectChange}
          placeholder="Subject line"
          className="border rounded px-3 py-2 text-sm flex-1"
        />
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
        {saveStatus && <span className="text-xs text-gray-500">{saveStatus}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium">Draft</p>
          <textarea
            value={body}
            onChange={handleBodyChange}
            placeholder={`Dear {{first_name}},\n\nYour letter here...`}
            className="border rounded px-3 py-2 text-sm h-96 resize-none font-mono"
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 font-medium">Preview — {previewContact.first_name} {previewContact.last_name}</p>
          <div className="border rounded px-4 py-3 h-96 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown>{previewBody}</ReactMarkdown>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Use <code>{'{{first_name}}'}</code> and <code>{'{{last_name}}'}</code> as variables.
      </p>
    </div>
  )
}
```

**Step 2: Create compose page**

Create `app/dashboard/compose/page.tsx`:
```tsx
import { getDraft, getRandomContact } from '@/lib/actions/letter'
import { LetterComposer } from '@/components/letter-composer'

export default async function ComposePage() {
  const [draft, contact] = await Promise.all([getDraft(), getRandomContact()])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Compose</h1>
      <LetterComposer
        initialSubject={draft.subject}
        initialBody={draft.body}
        previewContact={contact}
      />
    </div>
  )
}
```

**Step 3: Install Tailwind typography plugin**

```bash
pnpm add @tailwindcss/typography
```

Add to `tailwind.config.ts`:
```ts
plugins: [require('@tailwindcss/typography')],
```

**Step 4: Commit**

```bash
git add app/dashboard/compose/ components/letter-composer.tsx
git commit -m "feat: add letter composer with markdown editor and live preview"
```

---

## Task 13: Export and send page

**Files:**
- Create: `app/dashboard/export/page.tsx`
- Create: `components/export-panel.tsx`
- Create: `app/api/export/csv/route.ts`
- Create: `app/api/export/pdf/route.ts`

**Step 1: Create CSV export route**

Create `app/api/export/csv/route.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { toCsv } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const method = searchParams.get('method') // 'handwrite' | 'print' | 'all'

  const supabase = await createClient()
  let query = supabase
    .from('contacts')
    .select('first_name, last_name, address_line_1, address_line_2, city, state, zip, delivery_method')
    .eq('opted_out', false)

  if (method && method !== 'all') {
    query = query.eq('delivery_method', method)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const csv = toCsv(data ?? [])
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="contacts-${method || 'all'}.csv"`,
    },
  })
}
```

**Step 2: Create PDF export route**

Create `app/api/export/pdf/route.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { generateLetterPdf } from '@/lib/pdf'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const [{ data: draft }, { data: contacts }] = await Promise.all([
    supabase.from('letter_drafts').select('body').single(),
    supabase.from('contacts')
      .select('first_name, last_name')
      .eq('delivery_method', 'print')
      .eq('opted_out', false),
  ])

  if (!draft?.body) return NextResponse.json({ error: 'No draft saved.' }, { status: 400 })
  if (!contacts?.length) return NextResponse.json({ error: 'No print contacts.' }, { status: 400 })

  const buffer = await generateLetterPdf(contacts, draft.body)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="letters.pdf"',
    },
  })
}
```

**Step 3: Create export panel component**

Create `components/export-panel.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'

export function ExportPanel() {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return
    setSending(true)
    const result = await sendDigitalLetters()
    setDigitalStatus(result.error ? `Error: ${result.error}` : `Sent to ${(result as { count?: number }).count} contacts.`)
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">CSV Export (Avery label format)</h2>
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export/csv?method=handwrite" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            Handwrite contacts
          </a>
          <a href="/api/export/csv?method=print" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            Print contacts
          </a>
          <a href="/api/export/csv?method=all" className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50">
            All contacts
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">PDF Export (Print contacts)</h2>
        <a
          href="/api/export/pdf"
          className="inline-block border rounded px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Download PDF
        </a>
        <p className="text-xs text-gray-400 mt-1">One page per print contact. Letter variables interpolated.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Digital Send (via Resend)</h2>
        <button
          onClick={handleDigitalSend}
          disabled={sending}
          className="border rounded px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send to digital contacts'}
        </button>
        {digitalStatus && <p className="text-xs text-gray-600 mt-2">{digitalStatus}</p>}
        <p className="text-xs text-gray-400 mt-1">Sends the composed letter to all contacts marked Digital (excluding opted-out).</p>
      </section>
    </div>
  )
}
```

**Step 4: Create export page**

Create `app/dashboard/export/page.tsx`:
```tsx
import { ExportPanel } from '@/components/export-panel'

export default function ExportPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Export & Send</h1>
      <ExportPanel />
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add app/ components/export-panel.tsx
git commit -m "feat: add export panel with CSV download, PDF export, and digital send"
```

---

## Task 14: Final wiring and env documentation

**Files:**
- Modify: `app/page.tsx`
- Modify: `.env.example`
- Modify: `CLAUDE.md`

**Step 1: Redirect root to dashboard**

Replace `app/page.tsx` with:
```tsx
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/dashboard')
}
```

**Step 2: Update .env.example with all variables**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=you@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourapp.vercel.app
CRON_SECRET=your-random-secret
```

**Step 3: Run full test suite**

```bash
pnpm test
```

Expected: All tests PASS.

**Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: No type errors.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete NomadMail MVP"
```

---

## Environment Setup Summary

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | A verified sender domain in Resend |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel deployment URL (or `http://localhost:3000` locally) |
| `CRON_SECRET` | Any random string — also set in Vercel project env vars |

The Vercel cron job in `vercel.json` calls `/api/cron/send-verifications` daily at 9am UTC. Set `CRON_SECRET` in Vercel env vars and Vercel will pass it automatically via the `Authorization: Bearer` header.
