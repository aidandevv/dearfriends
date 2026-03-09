# Design: Social & Delight Features

**Date:** 2026-03-09
**Scope:** Friends-to-small-SaaS expansion features focused on warmth, interactivity, and physical mail encouragement.

---

## Overview

Five features that add a social/delight layer to NomadMail without overbuilding. Each feature creates a moment of warmth that reinforces physical mail as the primary goal. Designed as MVP-done-well — no billing or heavy multi-tenant plumbing yet.

---

## Feature 1: Admin Profile

**Purpose:** Give the admin a sender identity that personalizes the recipient's experience end-to-end.

**Data:** New `profiles` table (or Supabase user metadata extension):
- `display_name` — shown on share link and thank-you page
- `avatar_url` — optional photo (Supabase Storage)
- `bio` — short "from" blurb, 1-2 sentences (e.g. "Sending love from Portland, OR")
- `sender_name` — appears as "From:" in outgoing emails, defaults to `display_name`

**UX:**
- Onboarding (`/onboarding`) collects `display_name` and optionally `bio` — keeps signup fast
- Avatar and `sender_name` configurable later at `/dashboard/settings`
- All outgoing emails (digital send + address refresh nudge) pull from this profile

---

## Feature 2: Warm Thank-You Page

**Purpose:** Replace the generic post-submission success state with a warm, personalized moment.

**Where:** `/share/[adminId]` — same page, UI swap after form submission (no redirect).

**What it shows:**
- Admin's avatar + display name ("From Aidan")
- Admin's bio blurb
- Personalized message using recipient's first name: "Thanks, Sarah! Your address is saved. Can't wait to send you something."
- Note-back field (see Feature 3)

**UX:**
- Animated in with smooth fade/slide
- Admin profile data fetched server-side when share page loads — available immediately
- Falls back to monogram avatar (display name initial) if no photo uploaded

---

## Feature 3: Note-Back

**Purpose:** Let recipients leave a short message for the admin, adding a human two-way touch.

**Where:** Thank-you page, below the warm message.

**Data:** New `note` column (text, nullable) on `contacts` table.

**UX:**
- Optional textarea, 280-character limit
- Placeholder: "Leave a note for [admin display_name]..."
- Submit button: "Send note" — warm styling
- After submit: field replaced with "Note sent ✓"
- No auth required — note tied to the just-created/updated contact record
- Admin receives a notification email: "[Sarah] left you a note: 'So excited! Miss you!'"
- Note visible in dashboard — new column or expanded contact row detail

---

## Feature 4: Letter Templates

**Purpose:** Give admins a creative starting point with seasonal personality.

**Where:** `/dashboard/compose` — horizontal template picker above the markdown editor.

**Templates (4):**
- **Holiday** — warm, cozy; default wintery letter copy
- **Summer** — bright, breezy; casual catch-up tone
- **Birthday** — celebratory; upbeat copy
- **Evergreen** — clean, timeless; works year-round

**Data:** Client-side constants only — JSON config with `id`, `name`, `defaultBody`, `fontFamily`, `accentColor`. No DB needed.

**UX:**
- Horizontal scroll of small cards with label + color swatch
- One click to apply; warns if editor has existing content ("Replace your current draft with this template?")
- Accent color appears in live PDF preview and final PDF export
- Font applied in PDF only — editor stays simple markdown

---

## Feature 5: Address Refresh Nudge

**Purpose:** Keep the address book accurate year-over-year with minimal friction.

**Where:** `/dashboard` — per-contact action menu + bulk action. Optional annual auto-send via cron.

**What it does:**
- Sends a warm email to the contact with a personalized link back to their share form (pre-filled with existing data)
- Contact updates via existing upsert logic — no new endpoint needed
- Admin can trigger manually (one contact or bulk) or opt into annual auto-send

**Email copy:**
> "Hey [first_name], [admin display_name] is updating their address book — mind taking 30 seconds to confirm yours is still current?" + CTA button → share form

**UX:**
- Manual: "Nudge to update address" in contact row action menu
- Bulk: checkbox-select → "Send address refresh" in bulk actions bar
- Email From field uses admin's `sender_name` and `display_name`
- Share form pre-fills fields via URL params from contact's existing data
- Annual auto-send: opt-in toggle in `/dashboard/settings`, fires January 1st via existing `/api/cron/send-verifications` endpoint

---

## Database Changes

| Change | Detail |
|--------|--------|
| New `profiles` table | `user_id` (FK auth.users), `display_name`, `avatar_url`, `bio`, `sender_name` |
| `contacts.note` | `text`, nullable — stores recipient note-back |

---

## Out of Scope (for now)

- Billing / SaaS subscription management
- Multi-admin / team accounts
- Recipient accounts or persistent recipient profiles
- Template editor (custom templates) — admins edit markdown after applying
