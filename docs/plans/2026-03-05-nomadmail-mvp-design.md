# NomadMail MVP Design

_Date: 2026-03-05_

## Overview

NomadMail is a lightweight hybrid CRM for collecting mailing addresses via a public share link, managing contacts, and generating personalized holiday letters/labels. The MVP covers address collection, contact management, a markdown letter composer, verification emails, and export/send.

## Architecture

- **Framework:** Next.js 15, App Router, TypeScript strict mode
- **Database & Auth:** Supabase (Postgres + magic link auth). Server-side Supabase client used in all server actions and server components. Browser client used only for the auth flow.
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Address autocomplete:** Stubbed as plain text input (Google Places API placeholder)
- **Email:** Resend — for verification emails and digital letter sends
- **Hosting:** Vercel (Hobby). One Vercel Cron job for scheduled verification sends.

## Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/login` | public | Magic link request form |
| `/auth/callback` | public | Supabase auth callback |
| `/share/[adminId]` | public | Address collection form |
| `/verify/[token]` | public | Recipient confirm / edit / opt out |
| `/dashboard` | protected | Contact management table |
| `/dashboard/compose` | protected | Letter composer |
| `/dashboard/export` | protected | Export + digital send |

Middleware at `middleware.ts` protects all `/dashboard/*` routes, redirecting unauthenticated users to `/login`.

## Data Model

### `contacts`
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
admin_id             uuid NOT NULL REFERENCES auth.users(id)
first_name           text NOT NULL
last_name            text NOT NULL
email                text NOT NULL
address_line_1       text NOT NULL
address_line_2       text
city                 text NOT NULL
state                text NOT NULL
zip                  text NOT NULL
tags                 text[] NOT NULL DEFAULT '{}'
delivery_method      text NOT NULL DEFAULT 'print' -- 'handwrite' | 'print' | 'digital'
opted_out            boolean NOT NULL DEFAULT false
verification_token   uuid
verification_sent_at timestamptz
verified_at          timestamptz
created_at           timestamptz NOT NULL DEFAULT now()
updated_at           timestamptz NOT NULL DEFAULT now()
UNIQUE (admin_id, email)
```

### `letter_drafts`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
admin_id   uuid NOT NULL REFERENCES auth.users(id) UNIQUE
subject    text NOT NULL DEFAULT ''
body       text NOT NULL DEFAULT ''
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```

### `scheduled_verifications`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
admin_id   uuid NOT NULL REFERENCES auth.users(id)
send_at    timestamptz NOT NULL
sent       boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```

### RLS Policies
- All tables: SELECT/UPDATE/DELETE enforce `admin_id = auth.uid()`
- `contacts`: public INSERT allowed when `admin_id` matches a valid `auth.users.id` (for share form)
- `contacts`: public UPDATE allowed when `verification_token` matches (for verify/opt-out flow) — no auth required

## Key Flows

### Address Collection (`/share/[adminId]`)
Plain form (address autocomplete stubbed). On submit → server action upserts into `contacts` keyed on `(admin_id, email)`. Shows success message in place, no redirect.

### Verification Flow
Admin triggers manually from dashboard or schedules via `scheduled_verifications`. On send:
1. Generate UUID token per contact, write to `verification_token` + `verification_sent_at`
2. Send Resend email with link to `/verify/[token]`
3. Recipient lands on pre-filled form: confirm (sets `verified_at`), edit address, or opt out (sets `opted_out = true`)
4. Token cleared after any action

Cron job at `/api/cron/send-verifications` runs daily, finds rows where `send_at <= now() AND sent = false`, fires verification batch, marks `sent = true`.

### Letter Composer (`/dashboard/compose`)
Markdown textarea with live preview side-by-side. Preview interpolates `{{first_name}}` / `{{last_name}}` from a randomly selected contact. Draft auto-saves (upserted — one draft per admin) via server action.

### Export & Send (`/dashboard/export`)
- **CSV:** Download contacts filtered by delivery method in Avery label mail-merge format
- **PDF:** Server-side render one letter per `print` contact (variables interpolated), returned as PDF
- **Digital send:** Iterate `digital` contacts excluding opted-out, interpolate variables, send full letter body via Resend

## File Structure

```
dearfriends/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (public)/
│   │   ├── share/[adminId]/page.tsx
│   │   └── verify/[token]/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx          — sidebar nav
│   │   ├── page.tsx            — contact table
│   │   ├── compose/page.tsx
│   │   └── export/page.tsx
│   ├── api/
│   │   └── cron/send-verifications/route.ts
│   └── layout.tsx
├── components/ui/              — shadcn primitives
├── components/
│   ├── contact-table.tsx
│   ├── contact-form.tsx
│   ├── letter-composer.tsx
│   └── export-panel.tsx
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── actions/
│   │   ├── contacts.ts
│   │   ├── verification.ts
│   │   ├── letter.ts
│   │   └── export.ts
│   ├── resend.ts
│   ├── pdf.ts
│   └── utils.ts
├── middleware.ts
└── supabase/
    └── migrations/
        └── 001_initial.sql
```

## Dependencies

- `@supabase/ssr` + `@supabase/supabase-js` — Supabase client with SSR support
- `resend` — email sending
- `@react-pdf/renderer` — server-side PDF generation
- `react-markdown` — letter preview rendering
- `react-hook-form` + `@hookform/resolvers` + `zod` — form validation
- shadcn/ui components as needed
