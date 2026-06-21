# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NomadMail** — a lightweight hybrid CRM for collecting mailing addresses via a public link, managing contacts, and generating personalized holiday letters/labels.

**Primary flow:** Admin generates a share link → recipient submits address → admin drafts a markdown letter with `{{first_name}}` variables → admin exports to PDF/CSV or triggers digital email sends.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript, strict mode)
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security)
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Address Autocomplete:** Google Places API
- **Email:** Resend API
- **Hosting:** Vercel (Hobby Tier)

## Key Routes

| Route | Purpose |
|-------|---------|
| `/share/[admin_uuid]` | Public address collection form (unauthenticated) |
| `/dashboard` | Contact management table |
| `/dashboard/compose` | Markdown letter composer with live preview |
| `/dashboard/export` | CSV/PDF export and digital send |

## Database Schema

**`contacts` table** — linked to `users.id` via `admin_id`:
- `id`, `admin_id`, `first_name`, `last_name`, `email`
- `address_line_1`, `address_line_2` (nullable), `city`, `state`, `zip`
- `tags` (text[]), `delivery_method` (enum: `handwrite` | `print` | `digital`)
- `created_at`, `updated_at`

**RLS policy:** All authenticated contact CRUD must enforce `admin_id = auth.uid()`. Public share and verification flows are server-mediated; do not add anonymous direct contact insert/update policies.

## Architecture Notes

- Form submissions on `/share/[slug]` go through a signed server capability and never overwrite existing `(admin_id, email)` contacts.
- Public share pages resolve only configured share slugs; `/share/<user-uuid>` is not supported.
- Public share form submissions use a short-lived signed server capability and insert new contacts only. Existing contacts must be updated through verification links, not by public share overwrite.
- Verification links are server-mediated, single-use, and expire after 14 days. Do not grant anonymous direct table update policies for contact verification.
- The letter composer uses `{{first_name}}` / `{{last_name}}` variable interpolation rendered into live markdown preview with a randomly selected contact.
- CSV export targets Avery label mail-merge format for `handwrite` and `print` contacts.
- PDF export renders one letter per page for `handwrite` and `print` contacts with variables injected (reference for handwritten mail; print-ready for at-home printing).
- Digital send batches emails via Resend to `digital` contacts. Dear Friends does not mail physical letters.

## Environment Variables

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard -> Project Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard -> Project Settings -> API |
| `RESEND_API_KEY` | Resend dashboard -> API Keys |
| `RESEND_FROM_EMAIL` | Verified sender in Resend |
| `NEXT_PUBLIC_SITE_URL` | Vercel deployment URL (or `http://localhost:3000` locally) |
| `CRON_SECRET` | Non-empty random secret shared with Vercel cron auth header |

Cron endpoints fail closed when `CRON_SECRET` is missing or blank. `GET /api/cron/send-verifications` and `GET /api/cron/send-calendar-reminders` require `Authorization: Bearer ${CRON_SECRET}`.

## Build Order (per PRD)

1. Scaffold (Next.js, Tailwind, shadcn, Supabase client)
2. Apply SQL schema + RLS policies
3. Epic 1: Public collection form (`/share/[slug]`)
4. Epic 2: Admin dashboard (`/dashboard`)
5. Epic 3: Hybrid composer (`/dashboard/compose`)
6. Epic 4: Export & dispatch (`/dashboard/export`)
