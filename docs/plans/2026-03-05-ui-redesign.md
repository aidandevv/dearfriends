# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign every page of NomadMail with a warm linen + terracotta aesthetic using Playfair Display headings and DM Sans body text.

**Architecture:** Pure UI layer change — all server actions, data flow, and API routes are untouched. New design tokens are applied via CSS custom properties in `globals.css`, Tailwind is extended with those tokens and Google Fonts, and each page/component is rewritten with the new visual language.

**Tech Stack:** Next.js App Router, Tailwind CSS, `next/font/google` (Playfair Display + DM Sans), `lucide-react` (icons)

---

## Task 1: Install lucide-react

**Files:**
- Modify: `package.json`

**Step 1: Install lucide-react**

```bash
pnpm add lucide-react
```

**Step 2: Verify it installed**

```bash
pnpm run typecheck
```

Expected: no errors (or same errors as before — baseline).

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "add lucide-react"
```

---

## Task 2: Design tokens in globals.css

Replace the entire contents of `app/globals.css` with:

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --linen: #F5EFE4;
  --surface: #FAF7F1;
  --surface-raised: #FFFFFF;
  --terra: #C05C2E;
  --terra-dark: #9E4A23;
  --ink: #231209;
  --ink-muted: #7A6352;
  --border: #DDD0BC;
  --sage: #5A7A5A;
  --sidebar: #EDE6D6;
}

body {
  color: var(--ink);
  background: var(--linen);
  font-family: var(--font-dm-sans), system-ui, sans-serif;
}

@layer components {
  .input {
    @apply bg-surface border border-border rounded-lg px-3 py-2 text-sm text-ink w-full
           focus:outline-none focus:ring-2 focus:ring-terra/40 focus:border-terra
           placeholder:text-ink-muted/50 transition-colors;
  }

  .btn-primary {
    @apply bg-terra hover:bg-terra-dark text-white rounded-full px-6 py-2.5 text-sm font-medium
           transition-colors disabled:opacity-50 cursor-pointer;
  }

  .btn-outline {
    @apply border border-border hover:bg-surface text-ink rounded-full px-6 py-2.5 text-sm font-medium
           transition-colors disabled:opacity-50 cursor-pointer;
  }
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "add design tokens and shared component classes"
```

---

## Task 3: Configure fonts and Tailwind

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

**Step 1: Update layout.tsx**

Replace the full file:

```tsx
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Dear Friends",
  description: "Collect mailing addresses and send personalized letters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Update tailwind.config.ts**

Replace the full file:

```ts
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        linen: "var(--linen)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        terra: "var(--terra)",
        "terra-dark": "var(--terra-dark)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        border: "var(--border)",
        sage: "var(--sage)",
        sidebar: "var(--sidebar)",
      },
    },
  },
  plugins: [typography],
};
export default config;
```

**Step 3: Typecheck**

```bash
pnpm run typecheck
```

**Step 4: Commit**

```bash
git add app/layout.tsx tailwind.config.ts
git commit -m "configure Playfair Display + DM Sans and extend Tailwind tokens"
```

---

## Task 4: Shared UI components

**Files:**
- Create: `components/ui/postmark.tsx`
- Create: `components/ui/pill-badge.tsx`

**Step 1: Create components/ui/postmark.tsx**

```tsx
import { Mail } from 'lucide-react'

export function Postmark() {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-terra text-terra mb-4">
      <Mail size={24} />
    </div>
  )
}
```

**Step 2: Create components/ui/pill-badge.tsx**

```tsx
type DeliveryMethod = 'handwrite' | 'print' | 'digital'

const styles: Record<DeliveryMethod, string> = {
  digital: 'bg-terra text-white',
  print: 'bg-ink text-white',
  handwrite: 'bg-sage text-white',
}

const labels: Record<DeliveryMethod, string> = {
  digital: 'Digital',
  print: 'Print',
  handwrite: 'Handwrite',
}

export function PillBadge({ method }: { method: string }) {
  const key = method as DeliveryMethod
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${styles[key] ?? 'bg-border text-ink'}`}>
      {labels[key] ?? method}
    </span>
  )
}
```

**Step 3: Typecheck**

```bash
pnpm run typecheck
```

**Step 4: Commit**

```bash
git add components/ui/
git commit -m "add Postmark and PillBadge shared components"
```

---

## Task 5: Public share form

**Files:**
- Modify: `app/(public)/share/[adminId]/page.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactInput } from '@/lib/schemas'
import { upsertContact } from '@/lib/actions/contacts'
import { Postmark } from '@/components/ui/postmark'
import { Mail } from 'lucide-react'

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
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center gap-3">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Sealed & sent.</h1>
          <p className="text-ink-muted text-sm">Your address has been saved. Expect something special in the mail.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink text-center">Share your address</h1>
          <p className="text-ink-muted text-sm mt-2 text-center">
            Something special is being put together, and they&apos;d love to send it your way.
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">First name</label>
              <input {...register('first_name')} className="input" />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Last name</label>
              <input {...register('last_name')} className="input" />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Email</label>
            <input {...register('email')} type="email" className="input" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Address</label>
            <input {...register('address_line_1')} placeholder="Street address" className="input" />
            {errors.address_line_1 && <p className="text-xs text-red-500">{errors.address_line_1.message}</p>}
            <input
              {...register('address_line_2')}
              placeholder="Apt, suite, etc. (optional)"
              className="input mt-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">City</label>
              <input {...register('city')} className="input" />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">State</label>
              <input {...register('state')} className="input" />
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">ZIP</label>
              <input {...register('zip')} className="input" />
              {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center gap-2 mt-2 w-full"
          >
            <Mail size={16} />
            {isSubmitting ? 'Saving\u2026' : 'Submit my address'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add "app/(public)/share/[adminId]/page.tsx"
git commit -m "redesign public share form"
```

---

## Task 6: Verify page

**Files:**
- Modify: `app/(public)/verify/[token]/page.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { verifySchema, type VerifyInput } from '@/lib/schemas'
import { handleVerifyToken } from '@/lib/actions/verification'
import { Postmark } from '@/components/ui/postmark'

export default function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const [done, setDone] = useState<'confirmed' | 'updated' | 'optedout' | null>(null)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VerifyInput>({
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

  async function onUpdate(data: VerifyInput) {
    const { token } = await params
    await handleVerifyToken(token, 'update', data)
    setDone('updated')
  }

  if (done) {
    const messages = {
      confirmed: { heading: 'All confirmed.', body: 'Your address is correct. Something is on its way.' },
      updated: { heading: 'Address updated.', body: 'Thanks for keeping things current.' },
      optedout: { heading: "You're off the list.", body: "You won't receive any further mailings." },
    }
    const msg = messages[done]

    return (
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">{msg.heading}</h1>
          <p className="text-ink-muted text-sm">{msg.body}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center mb-8">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink text-center">Is your address still correct?</h1>
          <p className="text-ink-muted text-sm mt-2 text-center">
            Something special is heading your way &mdash; we want to make sure it reaches you.
          </p>
        </div>

        {!editing ? (
          <div className="flex flex-col gap-3">
            <button onClick={handleConfirm} className="btn-primary w-full">
              Yes, my address is correct
            </button>
            <button onClick={() => setEditing(true)} className="btn-outline w-full">
              No, I need to update it
            </button>
            <button
              onClick={handleOptOut}
              className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline mt-2 mx-auto block"
            >
              Opt out of future mailings
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-muted font-medium">Address</label>
              <input {...register('address_line_1')} placeholder="Street address" className="input" />
              {errors.address_line_1 && <p className="text-xs text-red-500">{String(errors.address_line_1.message)}</p>}
              <input {...register('address_line_2')} placeholder="Apt, suite, etc. (optional)" className="input mt-2" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">City</label>
                <input {...register('city')} className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">State</label>
                <input {...register('state')} className="input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ink-muted font-medium">ZIP</label>
                <input {...register('zip')} className="input" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? 'Saving...' : 'Update my address'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline mx-auto block"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add "app/(public)/verify/[token]/page.tsx"
git commit -m "redesign verify page"
```

---

## Task 7: Login page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Postmark } from '@/components/ui/postmark'
import { Mail } from 'lucide-react'

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
      <main className="min-h-screen bg-linen flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center gap-3 max-w-sm">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Check your inbox</h1>
          <p className="text-ink-muted text-sm">
            We sent a magic link to <strong className="text-ink">{email}</strong>. Click it to sign in.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-border p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
          <p className="text-ink-muted text-sm mt-1">Sign in to manage your contacts</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-muted font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full">
            <Mail size={16} />
            {loading ? 'Sending\u2026' : 'Send magic link'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "redesign login page"
```

---

## Task 8: Dashboard layout (sidebar)

**Files:**
- Modify: `app/dashboard/layout.tsx`

**Step 1: Replace the full file**

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, PenLine, Send, Link2 } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`

  return (
    <div className="flex min-h-screen bg-linen">
      <nav className="w-56 bg-sidebar flex flex-col p-5 gap-1 shrink-0 border-r border-border/60">
        <p className="font-serif text-xl text-ink mb-5 px-3">Dear Friends</p>

        <Link href="/dashboard" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <Users size={15} />
          Contacts
        </Link>
        <Link href="/dashboard/compose" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <PenLine size={15} />
          Compose
        </Link>
        <Link href="/dashboard/export" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <Send size={15} />
          Export &amp; Send
        </Link>

        <div className="mt-auto pt-4 border-t border-border/60">
          <p className="text-xs text-ink-muted mb-1.5 flex items-center gap-1 px-3">
            <Link2 size={10} /> Share link
          </p>
          <a
            href={shareUrl}
            className="text-xs text-terra hover:text-terra-dark break-all px-3"
            target="_blank"
            rel="noreferrer"
          >
            {shareUrl}
          </a>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-border/60 p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "redesign dashboard sidebar"
```

---

## Task 9: Dashboard page headings

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/compose/page.tsx`
- Modify: `app/dashboard/export/page.tsx`

**Step 1: Update app/dashboard/page.tsx**

Change `<h1 className="text-2xl font-semibold">Contacts</h1>` to:
```tsx
<h1 className="font-serif text-3xl text-ink">Contacts</h1>
```

Change the schedule verification section heading:
```tsx
<h2 className="text-sm font-semibold mb-3">Schedule Verification</h2>
```
to:
```tsx
<h2 className="font-serif text-lg text-ink mb-3">Schedule Verification</h2>
```

**Step 2: Update app/dashboard/compose/page.tsx**

Change `<h1 className="text-2xl font-semibold mb-6">Compose</h1>` to:
```tsx
<h1 className="font-serif text-3xl text-ink mb-6">Compose</h1>
```

**Step 3: Update app/dashboard/export/page.tsx**

Change `<h1 className="text-2xl font-semibold mb-6">Export & Send</h1>` to:
```tsx
<h1 className="font-serif text-3xl text-ink mb-6">Export &amp; Send</h1>
```

**Step 4: Typecheck**

```bash
pnpm run typecheck
```

**Step 5: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/compose/page.tsx app/dashboard/export/page.tsx
git commit -m "update dashboard page headings to serif"
```

---

## Task 10: ContactTable → card layout

**Files:**
- Modify: `components/contact-table.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState } from 'react'
import { updateContact, deleteContact } from '@/lib/actions/contacts'
import { PillBadge } from '@/components/ui/pill-badge'
import { CheckCircle, Circle, Ban, Trash2 } from 'lucide-react'

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
    return (
      <div className="text-center py-16">
        <p className="font-serif text-2xl text-ink-muted">No contacts yet</p>
        <p className="text-sm text-ink-muted mt-2">Share your link to start collecting addresses.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {contacts.map(c => (
        <div
          key={c.id}
          className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-linen/40 transition-colors ${pending === c.id ? 'opacity-50' : ''}`}
        >
          <div className="flex-1 min-w-0">
            <p className="font-serif text-base text-ink">{c.first_name} {c.last_name}</p>
            <p className="text-xs text-ink-muted mt-0.5 truncate">{c.email} · {c.city}, {c.state}</p>
          </div>

          <PillBadge method={c.delivery_method} />

          <div className="flex items-center gap-1 text-ink-muted shrink-0">
            {c.opted_out
              ? <Ban size={14} className="text-red-400" />
              : c.verified_at
              ? <CheckCircle size={14} className="text-sage" />
              : <Circle size={14} />
            }
            <span className="text-xs">
              {c.opted_out ? 'Opted out' : c.verified_at ? 'Verified' : 'Unverified'}
            </span>
          </div>

          <select
            value={c.delivery_method}
            disabled={pending === c.id}
            onChange={e => handleDeliveryChange(c.id, e.target.value)}
            className="border border-border rounded-lg px-2 py-1 text-xs bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra/40 shrink-0"
          >
            <option value="handwrite">Handwrite</option>
            <option value="print">Print</option>
            <option value="digital">Digital</option>
          </select>

          <button
            onClick={() => handleDelete(c.id)}
            disabled={pending === c.id}
            className="text-ink-muted hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add components/contact-table.tsx
git commit -m "redesign contact table as warm card list"
```

---

## Task 11: SendVerificationButton and ScheduleVerificationForm

**Files:**
- Modify: `components/send-verification-button.tsx`
- Modify: `components/schedule-verification-form.tsx`

**Step 1: Replace send-verification-button.tsx**

```tsx
'use client'

import { useState } from 'react'
import { sendVerificationToAll } from '@/lib/actions/verification'
import { MailCheck } from 'lucide-react'

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
      {status && <p className="text-xs text-ink-muted">{status}</p>}
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-outline flex items-center gap-1.5 text-sm px-4 py-2 w-auto rounded-full"
      >
        <MailCheck size={14} />
        {loading ? 'Sending...' : 'Send Verification'}
      </button>
    </div>
  )
}
```

**Step 2: Replace schedule-verification-form.tsx**

```tsx
'use client'

import { useState } from 'react'
import { scheduleVerification } from '@/lib/actions/verification'
import { CalendarClock } from 'lucide-react'

export function ScheduleVerificationForm() {
  const [status, setStatus] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await scheduleVerification(formData)
    setStatus(result.error ? `Error: ${result.error}` : 'Scheduled.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-ink-muted font-medium flex items-center gap-1">
          <CalendarClock size={12} /> Send at
        </label>
        <input
          type="datetime-local"
          name="send_at"
          required
          className="input w-auto"
        />
      </div>
      <button type="submit" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
        Schedule
      </button>
      {status && <p className="text-xs text-ink-muted self-center">{status}</p>}
    </form>
  )
}
```

**Step 3: Typecheck**

```bash
pnpm run typecheck
```

**Step 4: Commit**

```bash
git add components/send-verification-button.tsx components/schedule-verification-form.tsx
git commit -m "restyle verification button and schedule form"
```

---

## Task 12: Letter composer

**Files:**
- Modify: `components/letter-composer.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState, useRef } from 'react'
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function triggerSave(nextSubject: string, nextBody: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!nextSubject.trim()) return
      setSaving(true)
      await saveDraft({ subject: nextSubject, body: nextBody })
      setSaving(false)
      setSaveStatus('Saved')
      setTimeout(() => setSaveStatus(null), 2000)
    }, 1000)
  }

  const previewBody = interpolate(body, previewContact)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs text-ink-muted font-medium">Subject</label>
          <input
            value={subject}
            onChange={e => { setSubject(e.target.value); triggerSave(e.target.value, body) }}
            placeholder="Subject line"
            className="input"
          />
        </div>
        <span className="text-xs text-ink-muted pb-2.5 min-w-[40px]">
          {saving ? 'Saving...' : saveStatus ?? ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">Draft</p>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); triggerSave(subject, e.target.value) }}
            placeholder={'Dear {{first_name}},\n\nYour letter here...'}
            className="input h-96 resize-none font-mono text-xs leading-relaxed"
          />
          <p className="text-xs text-ink-muted">
            Use{' '}
            <code className="bg-linen px-1.5 py-0.5 rounded text-terra font-mono">{'{{first_name}}'}</code>
            {' '}and{' '}
            <code className="bg-linen px-1.5 py-0.5 rounded text-terra font-mono">{'{{last_name}}'}</code>
            {' '}as variables.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">
            Preview — {previewContact.first_name} {previewContact.last_name}
          </p>
          <div className="bg-surface-raised border border-border rounded-xl shadow-sm p-6 h-96 overflow-y-auto">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-serif text-sm text-ink-muted italic">{subject || 'Subject line'}</p>
            </div>
            <div className="prose prose-sm max-w-none font-serif text-ink">
              <ReactMarkdown>{previewBody}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add components/letter-composer.tsx
git commit -m "redesign letter composer with letter preview"
```

---

## Task 13: Export panel

**Files:**
- Modify: `components/export-panel.tsx`

**Step 1: Replace the full file**

```tsx
'use client'

import { useState } from 'react'
import { sendDigitalLetters } from '@/lib/actions/letter'
import { FileText, FileDown, Send } from 'lucide-react'

export function ExportPanel() {
  const [digitalStatus, setDigitalStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleDigitalSend() {
    if (!confirm('Send the composed letter to all digital contacts?')) return
    setSending(true)
    const result = await sendDigitalLetters()
    setDigitalStatus(
      result.error
        ? `Error: ${result.error}`
        : `Sent to ${(result as { count?: number }).count} contacts.`
    )
    setSending(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <ExportCard
        icon={<FileText size={18} className="text-terra" />}
        title="CSV Export"
        description="Avery label format for mail merge"
      >
        <div className="flex gap-2 flex-wrap">
          <a href="/api/export/csv?method=handwrite" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            Handwrite contacts
          </a>
          <a href="/api/export/csv?method=print" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            Print contacts
          </a>
          <a href="/api/export/csv?method=all" className="btn-outline text-sm px-4 py-2 w-auto rounded-full">
            All contacts
          </a>
        </div>
      </ExportCard>

      <ExportCard
        icon={<FileDown size={18} className="text-terra" />}
        title="PDF Export"
        description="One page per print contact with variables interpolated"
      >
        <a href="/api/export/pdf" className="btn-outline text-sm px-4 py-2 w-auto rounded-full inline-block">
          Download PDF
        </a>
      </ExportCard>

      <ExportCard
        icon={<Send size={18} className="text-terra" />}
        title="Digital Send"
        description="Sends the composed letter to all digital contacts via Resend"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDigitalSend}
            disabled={sending}
            className="btn-primary text-sm px-5 py-2 w-auto rounded-full"
          >
            {sending ? 'Sending...' : 'Send to digital contacts'}
          </button>
          {digitalStatus && <p className="text-xs text-ink-muted">{digitalStatus}</p>}
        </div>
      </ExportCard>
    </div>
  )
}

function ExportCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-border rounded-xl bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-serif text-lg text-ink">{title}</h2>
      </div>
      <p className="text-xs text-ink-muted">{description}</p>
      {children}
    </div>
  )
}
```

**Step 2: Typecheck**

```bash
pnpm run typecheck
```

**Step 3: Commit**

```bash
git add components/export-panel.tsx
git commit -m "redesign export panel with card sections"
```

---

## Task 14: Final build and push

**Step 1: Full production build**

```bash
pnpm run build
```

Expected: exits 0, no TypeScript or lint errors.

**Step 2: Push**

```bash
git push
```

Expected: Vercel picks up the commit and deploys successfully.
