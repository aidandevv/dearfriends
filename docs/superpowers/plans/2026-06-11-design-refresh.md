# Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the landing page and public share form with the cool porcelain/periwinkle palette per `docs/superpowers/specs/2026-06-11-design-refresh-design.md`.

**Architecture:** One token layer (CSS vars in `globals.css` + Tailwind theme) consumed by composable landing section components in `components/marketing/` and a restyled `share-form.tsx`. Zero changes to server actions, validation, or share-page server logic. Visual sections are built with Tailwind utilities against theme tokens — no new hardcoded hex constants in components.

**Tech Stack:** Next.js 15 App Router, Tailwind 3.4, PPWriter + DM Sans (local fonts), CSS-only motion + one IntersectionObserver hook. No new dependencies.

**Context notes for the implementer:**
- `tailwind.config.ts` colors are stale (yellow) while `globals.css` `:root` was already neutralized in WIP. This plan syncs both to the new palette.
- Caveat font is NOT loaded; `--font-caveat` falls back to PPWriter. Use PPWriter italic for the single handwritten-style accent.
- Dashboard shares `ink`/`border`/`linen`/`surface` Tailwind tokens; updating them to cool values is intentional (continues the WIP neutralization). Do not otherwise touch dashboard files.
- `blue-ink` token stays (dashboard uses it). Landing/share switch to the new `periwinkle` token.

---

### Task 1: Token layer

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css` (`:root` block + utilities)

- [ ] **Step 1: Update Tailwind theme colors**

In `tailwind.config.ts`, replace the `colors` block with:

```ts
colors: {
  porcelain: "#F8F9FB",
  linen: "#F8F9FB",
  surface: "#EEF1F6",
  "surface-raised": "#FFFFFF",
  periwinkle: { DEFAULT: "#4A6CD4", deep: "#3A55AC" },
  peach: "#E8927C",
  "blue-ink": "#3358ba",
  "blue-mid": "#3e5da0",
  ink: "#232940",
  "ink-soft": "#4A5168",
  "ink-muted": "#8A91A6",
  border: "#DFE3EC",
  line: "#DFE3EC",
  sage: "#5A7A5A",
  sidebar: "#EAEAE6",
  cream: "#EEF1F6",
  "blue-slate": "#516183",
  stamp: "#b8453b",
},
```

(`linen`/`cream` are aliased to cool values rather than deleted so dashboard classes keep compiling.)

- [ ] **Step 2: Update `:root` vars in `app/globals.css`**

Replace the palette vars (keep `--font-caveat` line):

```css
:root {
  --porcelain: #F8F9FB;
  --linen: #F8F9FB;
  --surface: #EEF1F6;
  --surface-raised: #FFFFFF;
  --paper: #F8F9FB;
  --paper-2: #EEF1F6;
  --paper-3: #E4E8F0;
  --paper-deep: #D7DCE8;
  --periwinkle: #4A6CD4;
  --periwinkle-deep: #3A55AC;
  --peach: #E8927C;
  --blue-ink: #3358ba;
  --blue-mid: #3e5da0;
  --ink: #232940;
  --ink-soft: #4A5168;
  --ink-muted: #8A91A6;
  --border: #DFE3EC;
  --line: #DFE3EC;
  --line-soft: #E9ECF3;
  --sage: #5A7A5A;
  --sidebar: #EAEAE6;
  --cream: #EEF1F6;
  --cream-soft: #E4E8F0;
  --blue-slate: #516183;
  --stamp: #b8453b;
  --stamp-soft: #d97757;
  --muted: #8A91A6;
  --font-caveat: var(--font-ppwriter), cursive;
}
```

- [ ] **Step 3: Add marketing utilities to `globals.css`**

Append in `@layer utilities`:

```css
.grain-cool {
  background-image: radial-gradient(rgba(35, 41, 64, 0.04) 1px, transparent 1px);
  background-size: 3px 3px;
}
.dashed-rule {
  border-top: 1px dashed var(--line);
}
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 600ms ease, transform 600ms ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}
```

And inside the existing `prefers-reduced-motion` block add `.reveal { opacity: 1 !important; transform: none !important; transition: none !important; }`.

- [ ] **Step 4: Verify build compiles**

Run: `pnpm typecheck && pnpm build`
Expected: PASS (no type errors; build succeeds).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css
git commit -m "feat: cool porcelain/periwinkle design tokens"
```

---

### Task 2: Reveal-on-scroll component

**Files:**
- Create: `components/marketing/reveal.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function Reveal({ children, delay = 0, className = '' }: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            observer.disconnect()
          }
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/marketing/reveal.tsx
git commit -m "feat: add scroll reveal component"
```

---

### Task 3: Landing nav

**Files:**
- Modify: `components/marketing/landing-nav.tsx` (full rewrite, keep scroll-state hook)

- [ ] **Step 1: Rewrite against tokens**

Keep the `scrolled` state logic. Replace all hardcoded hex with tokens. Layout: wordmark left (PPWriter, "dear" italic + "friends", small peach stamp-dot mark with dashed ring), center links (How it works / Your people / Reminders) hidden on mobile, right side "Sign in" text link + periwinkle pill CTA "Start your book". Scrolled state: `rgba(248,249,251,0.85)` background + blur + `--line` border. All text `--ink`, hovers to `--periwinkle`.

- [ ] **Step 2: Commit**

```bash
git add components/marketing/landing-nav.tsx
git commit -m "feat: restyle landing nav for cool palette"
```

---

### Task 4: Landing sections

**Files:**
- Create: `components/marketing/sections.tsx` (hero, how-it-works, people, reminders, quote, closing, footer — may be split into multiple files if any grows past ~200 lines)
- Modify: `app/page.tsx` (becomes metadata + composition only; delete all inline-style constants/helpers)

Use the superpowers/frontend-design craft here; the binding constraints are:

- Tokens only — no new hex literals except inside the token layer.
- PPWriter for display headings (`clamp(40px, 6vw, 80px)` hero; `clamp(32px, 4.5vw, 52px)` sections), DM Sans body 16–18px, `--ink` text on porcelain.
- Postal nods allowed: stamp-mark in nav, dashed rules between sections, ONE PPWriter-italic annotation near hero CTA. No envelope/postcard illustration scenes, no rotated cards, no full-bleed dark band.
- Each section wrapped in `<Reveal>`.
- Mobile-first: single column under 1024px, no horizontal overflow at 390px.

**Copy deck (use verbatim, light edits allowed for fit):**

1. **Hero** — H1: "Real mail, for the people you'd miss." Sub: "dearfriends collects your friends' addresses, remembers their birthdays, and nudges you to send a card once in a while." Primary CTA → `/login`: "Start your book". Secondary anchor → `#how`: "See how it works". Annotation (PPWriter italic, peach underline): "no app needed — just a link". Below: three minimal vignettes joined by dashed connectors — (1) link chip `dearfriends.co/you`, (2) small white address card "Sam — Portland, OR", (3) stamped postcard corner with peach stamp square.
2. **How it works** (`id="how"`) — eyebrow "How it works"; H2: "Three small habits." Steps as text blocks over thin rules: "Share one link." / "Post it anywhere. Friends add their address in under a minute — no account needed." · "Remember the dates." / "Birthdays and big days, with a nudge a week early." · "Send something real." / "Write it, print it, or drop it in the mail."
3. **Your people** (`id="friends"`) — surface band. Eyebrow "Your people"; H2: "A little book of everyone you'd miss." Body: "Not a CRM — just your people, their addresses, and the dates that matter." Keep a flattened friend-list mock: white rounded-2xl card, 4 rows (avatar initial in periwinkle/peach/slate, name, city, one pill each: "birthday soon" periwinkle-tint / "write back" peach-tint / "family" surface), plus "+ add someone" ghost row. No tabs.
4. **Reminders** (`id="reminders"`) — eyebrow "Nudges, not notifications"; H2: "One quiet email when it's time." Body: "A heads-up before birthdays and a gentle note when someone hasn't heard from you in a while. No badges, no streaks." One reminder-card mock: white card, periwinkle clock icon chip, "Hana's birthday — next Friday", one body line, two pill buttons ("Start a card" filled periwinkle, "Later" ghost).
5. **Quote** — centered PPWriter italic, `clamp(24px, 3vw, 38px)`: "I sent my grandmother a postcard for the first time in twelve years. She called me the day it arrived." Attribution: "Jules — Brooklyn".
6. **Closing** (`id="start"`) — H2: "Someone's mailbox is waiting." Body: "Starting your book takes about four minutes." CTA "Start your book" → `/login`. Quiet line under: "Made by one person, for a few hundred friends."
7. **Footer** — wordmark, About / Privacy / Changelog links, `hi@dearfriends.co`, "© 2026". Dashed top rule.

- [ ] **Step 1: Build section components in `components/marketing/sections.tsx`**
- [ ] **Step 2: Rewrite `app/page.tsx`** — keep `metadata` export (update description to match new sub copy), render `<LandingNav />` + sections inside a porcelain wrapper with `grain-cool` fixed overlay. Delete every old constant/helper (`cream`, `paper`, `StepCard`, `FriendRow`, `ReminderCard`, etc.).
- [ ] **Step 3: Verify** — `pnpm typecheck && pnpm lint` PASS; `pnpm dev` renders `/` with no yellow remnants, no overflow at 390px.
- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/marketing/sections.tsx
git commit -m "feat: rebuild landing page on cool minimal design"
```

---

### Task 5: Share form

**Files:**
- Modify: `components/share-form.tsx` (visual layer only)

**Invariants (do not change):** `useForm` setup, `contactSchema` resolver, `submitPublicContact` call, field names/registration, international toggle state logic, note 280-char cap, success-state conditions, all props.

- [ ] **Step 1: Restyle the form state**

Replace the split-panel layout with: porcelain full-height background (`grain-cool`), single centered column `max-w-md`, generous py. Structure:

- Tiny wordmark top center (PPWriter, links nowhere — it's a landing-free surface).
- Sender header: 56px periwinkle circle with sender initial (white PPWriter letter), then "**{displayName}** wants to mail you something" (PPWriter, ~26px, `--ink`), then `recipientMessage` in PPWriter italic `--ink-soft`.
- White rounded-2xl card (`border-line`, soft shadow) containing the form.
- Group label "You" (13px, semibold, `--ink-soft`) above name/email; "Where to send it" above the address block. Field labels become normal-case 13px medium `--ink-soft` (no uppercase tracking).
- Inputs: `w-full rounded-xl border border-line bg-white px-4 text-base text-ink min-h-12 focus:border-periwinkle focus:ring-2 focus:ring-periwinkle/20 focus:outline-none placeholder:text-ink-muted/60`. (16px text — iOS zoom guard.)
- US/International segmented control: surface track, white selected thumb with periwinkle text + subtle shadow.
- Note block: `bg-surface` rounded-xl, white textarea inside.
- Submit: full-width `bg-periwinkle hover:bg-periwinkle-deep` white text rounded-full min-h-12, label "Send my address".
- Footer line: "Powered by dearfriends · your address stays private".

- [ ] **Step 2: Restyle the success state**

Porcelain background; peach stamp mark (rounded square, dashed white inner border, white "df" PPWriter italic) that animates in with `animate-fade-up`; H1 PPWriter "Address received."; body: "Thanks, {recipientFirstName} — {displayName} can take it from here." (fallback: "Your address is on its way to your friend."); keep the "Note sent ✓" line.

- [ ] **Step 3: Verify** — `pnpm typecheck && pnpm lint && pnpm test` PASS (share-capability/contacts tests untouched). Dev-render a share slug at 390px: no zoom on input focus, 48px touch targets, no overflow.
- [ ] **Step 4: Commit**

```bash
git add components/share-form.tsx
git commit -m "feat: redesign share form mobile-first"
```

---

### Task 6: Full verification

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — all PASS.
- [ ] **Step 2:** Playwright screenshots of `/` and a share page at 390×844 and 1440×900; check: no yellow tones, no horizontal scroll, focus rings visible, periwinkle text only at large sizes.
- [ ] **Step 3:** Fix anything found; amend or follow-up commits.
- [ ] **Step 4:** Final commit of any fixes.

```bash
git add -A && git commit -m "fix: design refresh polish after visual verification"
```
