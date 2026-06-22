# Dear Friends

Dear Friends is a small Next.js app for keeping a personal mailing-address book, collecting addresses through private share links, remembering important dates, and preparing letters or labels for mail you send yourself.

The app is built for a quiet, single-user correspondence workflow:

- collect addresses through signed public share links
- manage contacts, groups, delivery preferences, birthdays, and notes
- draft reusable letters with simple `{{first_name}}` and `{{last_name}}` variables
- export Avery-ready CSV labels and PDFs for physical mail
- send digital letters and reminder emails through Resend
- import calendar subscriptions and calculate practical mail-by dates

## Tech Stack

- Next.js App Router
- TypeScript
- Supabase Auth, Postgres, and Row Level Security
- Tailwind CSS
- React Hook Form and Zod
- Resend
- Playwright and Vitest

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill in the Supabase and Resend values in `.env.local`, then run the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `RESEND_API_KEY` | Server-only Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address for Resend |
| `NEXT_PUBLIC_SITE_URL` | Public app URL used in generated links |
| `CRON_SECRET` | Bearer token shared with scheduled cron calls |
| `GOOGLE_GEOCODING_API_KEY` | Optional server-side geocoding key; U.S. addresses can fall back to Census geocoding |

Never expose server-only variables with a `NEXT_PUBLIC_` prefix.

## Database

SQL migrations live in `supabase/migrations`. Apply them in order to a Supabase project before using the dashboard flows.

The security model assumes:

- authenticated dashboard reads/writes are scoped by Supabase RLS
- public share links use signed server capabilities instead of client-supplied admin IDs
- verification links are single-use and expire
- cron routes fail closed unless `CRON_SECRET` is set and supplied

## Scripts

```bash
pnpm dev          # local development
pnpm lint         # ESLint
pnpm build        # production build
pnpm typecheck    # TypeScript check
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright tests
```

## CI/CD

GitHub Actions runs the full release gate on every branch push and pull request:

```bash
pnpm install --frozen-lockfile --ignore-workspace
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

The Vercel deploy job runs only after those checks pass. Pull requests from the same repository receive preview deployments, `main` deploys to production, and manual runs can opt into production. Configure these repository secrets before enabling deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

If the project is also connected to Vercel's built-in Git integration, disable one of the deploy paths to avoid duplicate deployments.

## Deployment

The repository includes `vercel.json` for scheduled reminder jobs. Production deploys should run:

```bash
pnpm install --frozen-lockfile --ignore-workspace
pnpm build
```

Set all environment variables in the hosting provider. Do not commit `.env.local`.

## Security

Please see [SECURITY.md](SECURITY.md) for supported reporting practices.

## License

MIT
