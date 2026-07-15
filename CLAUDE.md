# Dear Friends repository guidance

Dear Friends is a Next.js correspondence workspace for collecting mailing addresses, organizing personal contacts, planning around meaningful dates, and preparing physical or digital letters.

## Stack

- Next.js App Router and strict TypeScript
- Supabase Auth, PostgreSQL, and Row Level Security
- Tailwind CSS with repository-owned components and design tokens
- React Hook Form and Zod
- Resend for transactional and digital-letter email
- Playwright and Vitest
- Vercel hosting and cron

## Key routes

| Route | Purpose |
| --- | --- |
| `/share/[segment]` | Public capability-backed address collection |
| `/verify/[token]` | Single-use address confirmation, update, or opt-out |
| `/dashboard` | Contact search, filters, groups, delivery preferences, and invite link |
| `/dashboard/compose` | Markdown letter composer with deterministic recipient preview |
| `/dashboard/export` | Audience-aware CSV/PDF export and digital sends |
| `/dashboard/calendar` | Events, calendar imports, mail-by dates, and reminders |
| `/dashboard/map` | Interactive and textual contact geography |
| `/dashboard/settings` | Profile, share slug, reminders, and verification scheduling |

## Architecture guardrails

- Derive tenant ownership from the authenticated session or a verified server capability. Never accept an administrator ID from a public client.
- Public share pages resolve configured personal or group slugs. Legacy user-ID share URLs are intentionally unsupported.
- Public contact submission inserts only. Existing contacts change through authenticated administration or a valid verification token.
- Verification tokens are server-mediated, single-use, and expire after 14 days. Do not add anonymous contact-update policies.
- Contact-group and calendar-contact relationships must remain within one administrator boundary.
- Draft, contact, group, and delivery mutations must surface pending, success, and error states. Do not report success before persistence succeeds.
- Bulk verification and digital sends must present the server-derived audience before execution. Preserve partial-failure information for recovery.
- Calendar date-only values must use the account timezone rather than the server’s local day boundary.
- Dear Friends exports physical-mail materials; it does not claim to mail physical letters.

## Database migrations

- Migrations live in `supabase/migrations` and use one unique, zero-padded numeric version.
- Published migration versions are immutable. Add the next version instead of reusing or renumbering an applied version.
- `012_reconcile_schema_history.sql` supersedes a former duplicate `006` reconciliation file and is deliberately safe after migrations `001` through `011`.
- Security invariants that can be checked statically belong in `supabase/migrations/security-policies.test.ts`.

## Environment

| Variable | Scope |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged database access |
| `RESEND_API_KEY` | Server-only email API credential |
| `RESEND_FROM_EMAIL` | Verified sending identity |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used in generated links |
| `CRON_SECRET` | Bearer secret for scheduled routes |
| `GOOGLE_GEOCODING_API_KEY` | Optional server-side geocoding provider |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Optional isolated authenticated browser fixture |

## Verification commands

Use the repository-local tools when global package-manager shims are unavailable:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

For installation or lockfile work inside the parent workspace, keep the operation scoped to this project with `pnpm install --frozen-lockfile --ignore-workspace`.
