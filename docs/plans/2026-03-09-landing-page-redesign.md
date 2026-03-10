# Landing Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing landing page with a sleek, modern, high-impact design that makes Dear Friends feel like a considered product — not a side project — and converts visitors to sign-ups.

**Architecture:** Redesign `app/page.tsx` in-place, create new marketing components under `components/marketing/`, and update `components/site-shell.tsx` for a transparent/blur nav. No new routes, no new dependencies. All animation via Tailwind + CSS custom props already present in the project.

**Tech Stack:** Next.js App Router, Tailwind CSS (existing palette: linen/surface/terra/ink/border), Playfair Display serif + DM Sans, Lucide icons

**Design direction:** Editorial warmth meets product polish. Think Notion meets a premium stationery brand. Dark hero with a warm ink background, generous whitespace, large serif type, subtle floating UI mockups, trust signals, and a clear CTA flow.

---

## Task 1: Update Nav & Footer in SiteShell

**Files:**
- Modify: `components/site-shell.tsx`

The current nav is minimal and unbranded. Update it to have a pill-style CTA button and transparent-to-solid scroll behavior via a CSS class toggled by a tiny client wrapper.

**Step 1: Create `components/marketing/nav.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/60 bg-linen/95 shadow-sm backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-serif text-2xl text-ink transition-colors hover:text-terra">
          Dear Friends
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/about"
            className="rounded-full px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            About
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-linen transition-colors hover:bg-terra"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
```

**Step 2: Update `components/site-shell.tsx`**

Replace the static `<header>` with `<MarketingNav />`. Remove the old nav import. Keep the footer but improve the copy.

```tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/nav'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-linen text-ink">
      <MarketingNav />
      {children}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
          <p className="font-serif text-base text-ink">Dear Friends</p>
          <p>Made for thoughtful address books, warm updates, and real mail.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-ink transition-colors hover:text-terra">
            Open your dashboard
            <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add components/site-shell.tsx components/marketing/nav.tsx
git commit -m "feat: sticky scroll-aware nav with transparent-to-solid transition"
```

---

## Task 2: Hero Section — Dark, Editorial, Large Type

**Files:**
- Modify: `app/page.tsx` (hero section only)
- Create: `components/marketing/hero.tsx`

**Step 1: Create `components/marketing/hero.tsx`**

The hero uses a dark ink background (like the existing CTA bar at the bottom) with large serif type, a warm gradient glow, and the floating dashboard mockup on the right. Add `pt-24` to account for the fixed nav.

```tsx
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

const mockContacts = [
  { name: 'Maya Chen', mode: 'Print', place: 'Portland, OR' },
  { name: 'Eli Rivera', mode: 'Handwrite', place: 'Brooklyn, NY' },
  { name: 'Sana Patel', mode: 'Digital', place: 'Austin, TX' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-24">
      {/* Warm radial glow behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #C05C2E 0%, transparent 70%)' }}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        {/* Left: copy */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-linen/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-linen/70">
            <Sparkles size={13} className="text-terra" />
            For people who still send something real
          </div>

          <h1 className="mt-6 font-serif text-5xl leading-[1.1] text-linen sm:text-6xl lg:text-7xl">
            Keep your people close,{' '}
            <em className="not-italic text-terra">even when life keeps moving.</em>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-linen/70">
            Dear Friends helps you gather addresses, write personal updates, and send mail with the kind of warmth a plain CRM never quite reaches.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-terra px-7 py-3.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-terra-dark"
            >
              Start your mailing list
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-linen/20 px-7 py-3.5 text-sm font-medium text-linen/80 transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-sm text-linen/40">Free to start. No credit card required.</p>
        </div>

        {/* Right: floating UI mockup */}
        <div className="relative z-10 lg:pl-4">
          <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            {/* Floating badge */}
            <div className="absolute -left-6 top-10 hidden w-40 rounded-[1.25rem] border border-white/10 bg-ink/80 p-3.5 shadow-xl backdrop-blur lg:block">
              <p className="text-[10px] uppercase tracking-widest text-linen/50">Latest</p>
              <p className="mt-1 font-serif text-lg text-linen">Holiday note</p>
              <p className="mt-1 text-xs leading-5 text-linen/50">Names already filled in.</p>
            </div>

            {/* Mock dashboard card */}
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Dashboard</p>
                  <p className="mt-0.5 font-serif text-xl text-ink">Spring update</p>
                </div>
                <div className="rounded-full bg-terra px-3 py-1 text-xs font-medium text-white">42 contacts</div>
              </div>

              <div className="space-y-2.5 p-4">
                {mockContacts.map(contact => (
                  <div key={contact.name} className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-linen/40 px-4 py-3">
                    <div>
                      <p className="font-serif text-base text-ink">{contact.name}</p>
                      <p className="text-xs text-ink-muted">{contact.place}</p>
                    </div>
                    <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink">
                      {contact.mode}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 bg-ink px-4 py-4 text-linen">
                <p className="text-[10px] uppercase tracking-widest text-linen/50">Letter preview</p>
                <p className="mt-1.5 font-serif text-xl">Dear Maya,</p>
                <p className="mt-1 text-sm leading-6 text-linen/70">
                  Here's a little update from our year. Hope something lovely finds its way to your mailbox soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to linen */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, #F5EFE4)' }}
      />
    </section>
  )
}
```

**Step 2: Replace hero in `app/page.tsx`**

Remove the existing hero `<section>` (lines 46–140 approx) and replace with:

```tsx
import { Hero } from '@/components/marketing/hero'
// ... in JSX:
<Hero />
```

**Step 3: Commit**

```bash
git add components/marketing/hero.tsx app/page.tsx
git commit -m "feat: dark editorial hero with warm glow and floating dashboard mockup"
```

---

## Task 3: Features Section — Large Cards with Icon Accent

**Files:**
- Create: `components/marketing/features.tsx`
- Modify: `app/page.tsx`

**Step 1: Create `components/marketing/features.tsx`**

Replace the three-column card grid with a more editorial layout — alternating large icon, large number label, and body text.

```tsx
import { HeartHandshake, Mailbox, PenSquare } from 'lucide-react'

const features = [
  {
    number: '01',
    icon: Mailbox,
    title: 'Collect addresses gracefully',
    body: 'Send one simple link and let friends share the details you need without the usual spreadsheet shuffle. Works on any device, no account needed for recipients.',
  },
  {
    number: '02',
    icon: PenSquare,
    title: 'Write once, personalize often',
    body: 'Draft a single letter, drop in names with {{first_name}} merge tags, and keep every note feeling like it was written with care. Live preview as you type.',
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Send the right way',
    body: 'Export for print, handwriting, or digital delivery so every update fits the relationship. CSV for labels, PDF for your printer, email for the rest.',
  },
]

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">What it does</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Everything a mailing list should be.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {features.map(({ number, icon: Icon, title, body }) => (
          <article
            key={number}
            className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface-raised px-6 py-7 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="absolute right-5 top-5 font-serif text-6xl font-bold leading-none text-border/60 select-none">
              {number}
            </span>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-terra/10 text-terra">
              <Icon size={22} />
            </div>
            <h3 className="font-serif text-2xl text-ink">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-ink-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Replace features section in `app/page.tsx`**

Remove the existing features `<section>` and replace with:

```tsx
import { Features } from '@/components/marketing/features'
// ... in JSX:
<Features />
```

**Step 3: Commit**

```bash
git add components/marketing/features.tsx app/page.tsx
git commit -m "feat: feature cards with large number accents and hover shadow"
```

---

## Task 4: How It Works — Visual Step Timeline

**Files:**
- Create: `components/marketing/how-it-works.tsx`
- Modify: `app/page.tsx`

**Step 1: Create `components/marketing/how-it-works.tsx`**

Replace the current step list with a horizontal step flow on desktop and vertical on mobile, with a connecting line between steps.

```tsx
const steps = [
  {
    label: 'Share your link',
    body: 'Generate a private link for your people. They open it on their phone and enter their address in 30 seconds.',
  },
  {
    label: 'Organize & draft',
    body: 'Tag contacts, pick delivery methods, and draft your letter once with {{first_name}} placeholders.',
  },
  {
    label: 'Send with care',
    body: 'Export a print PDF, download a label CSV, or send personalized emails — all in one place.',
  },
]

export function HowItWorks() {
  return (
    <section className="border-y border-border/70 bg-surface/60 py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">How it flows</p>
          <h2 className="mt-4 font-serif text-4xl text-ink">A simple rhythm for meaningful mail.</h2>
        </div>

        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Connecting line (desktop only) */}
          <div
            aria-hidden
            className="absolute left-[16.666%] right-[16.666%] top-7 hidden h-px bg-border/80 md:block"
          />

          {steps.map((step, index) => (
            <div key={step.label} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-surface-raised font-serif text-xl font-bold text-ink shadow-sm">
                0{index + 1}
              </div>
              <h3 className="mt-5 font-serif text-xl text-ink">{step.label}</h3>
              <p className="mt-2 max-w-xs text-sm leading-7 text-ink-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Replace how-it-works section in `app/page.tsx`**

Remove the existing "How it flows" `<section>` and replace with:

```tsx
import { HowItWorks } from '@/components/marketing/how-it-works'
// ... in JSX:
<HowItWorks />
```

**Step 3: Commit**

```bash
git add components/marketing/how-it-works.tsx app/page.tsx
git commit -m "feat: horizontal step timeline with connecting line for how-it-works"
```

---

## Task 5: Social Proof / Trust Bar

**Files:**
- Create: `components/marketing/trust-bar.tsx`
- Modify: `app/page.tsx`

A clean strip between How It Works and the CTA that reinforces the product's ethos with three short, punchy statements.

**Step 1: Create `components/marketing/trust-bar.tsx`**

```tsx
const signals = [
  { stat: 'Free to start', detail: 'No credit card. No trial. Just your address book.' },
  { stat: 'Private by default', detail: 'Your contacts are yours. No ads, no data selling.' },
  { stat: 'Works everywhere', detail: 'Desktop, tablet, or phone — for you and your recipients.' },
]

export function TrustBar() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="grid gap-5 rounded-[2rem] border border-border/80 bg-surface-raised p-8 md:grid-cols-3">
        {signals.map(({ stat, detail }) => (
          <div key={stat} className="flex flex-col gap-2 border-b border-border/60 pb-5 last:border-0 last:pb-0 md:border-b-0 md:border-r md:pb-0 md:pr-8 md:last:border-r-0 md:last:pr-0">
            <p className="font-serif text-2xl text-ink">{stat}</p>
            <p className="text-sm leading-6 text-ink-muted">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Add to `app/page.tsx`** between HowItWorks and the CTA section:

```tsx
import { TrustBar } from '@/components/marketing/trust-bar'
// ... in JSX:
<TrustBar />
```

**Step 3: Commit**

```bash
git add components/marketing/trust-bar.tsx app/page.tsx
git commit -m "feat: trust bar with three privacy/access signals"
```

---

## Task 6: Final CTA Section + Clean Up `app/page.tsx`

**Files:**
- Create: `components/marketing/cta-section.tsx`
- Modify: `app/page.tsx` (clean up, assemble final component list)

**Step 1: Create `components/marketing/cta-section.tsx`**

```tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-14 text-linen shadow-[0_24px_60px_rgba(35,18,9,0.18)]">
        {/* Warm glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #C05C2E 0%, transparent 70%)' }}
        />

        <div className="relative z-10 md:flex md:items-center md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-linen/50">Ready when you are</p>
            <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Less admin. <br />More connection.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-linen/70">
              Keep your contacts current, your letters personal, and your mailing ritual something you actually look forward to.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:mt-0 md:min-w-52">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-linen px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-white"
            >
              Start for free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border border-linen/20 px-7 py-3.5 text-sm font-medium text-linen/70 transition-colors hover:bg-white/10"
            >
              Read the full overview
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Rewrite `app/page.tsx` to use all marketing components**

```tsx
import type { Metadata } from 'next'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { TrustBar } from '@/components/marketing/trust-bar'
import { CtaSection } from '@/components/marketing/cta-section'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'Dear Friends',
  description: 'A warm, personal home for collecting mailing addresses and sending thoughtful updates.',
}

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <TrustBar />
        <CtaSection />
      </main>
    </SiteShell>
  )
}
```

**Step 3: Commit**

```bash
git add components/marketing/cta-section.tsx app/page.tsx
git commit -m "feat: final CTA section with warm glow; assemble complete landing page"
```

---

## Task 7: Build Check & Push

**Step 1: Run build**

```bash
pnpm build
```

Expected: clean build, no TypeScript errors, all routes listed.

**Step 2: Fix any type errors**

If TypeScript errors appear, fix and commit:
```bash
git add -A && git commit -m "fix: resolve TypeScript errors from landing page rebuild"
```

**Step 3: Push**

```bash
git push origin main
```

---

## Design Notes

- **No new dependencies** — all animation and color is Tailwind + existing tokens
- **`pt-24` in Hero** accounts for the fixed nav height — adjust if nav height changes
- **Radial glows** use inline `style` for the gradient since Tailwind can't express arbitrary radial gradients without a plugin
- **The dark Hero → light linen transition** is handled by the `h-24` gradient fade div at the bottom of the Hero section — this creates the "melting into the page" effect
- **The floating badge** in Hero is `hidden lg:block` — don't show on mobile where it'd overlap
- If `Postmark` component (the stamp illustration from the original) is desired back in, import and place it above the eyebrow chip in `hero.tsx`
