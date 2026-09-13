# Testing Dear Friends

Dear Friends treats public-address collection, tenant isolation, correspondence delivery, and reminders as trust-sensitive workflows. The testing suite is deliberately layered: no individual test type is used as a proxy for the rest.

## Run locally

This checkout is currently nested under another pnpm workspace. From this directory, add `--ignore-workspace` so pnpm treats Dear Friends as its own project:

```bash
pnpm --ignore-workspace install --frozen-lockfile
pnpm --ignore-workspace run lint
pnpm --ignore-workspace run typecheck
pnpm --ignore-workspace run test:coverage
pnpm --ignore-workspace run build
pnpm --ignore-workspace run test:e2e:public
pnpm --ignore-workspace run test:a11y
```

In a normal standalone clone, the shorter `pnpm install` and `pnpm run <script>` forms are sufficient.

## Test layers

| Command | Evidence | External side effects |
| --- | --- | --- |
| `pnpm test` | Fast Vitest unit, security-boundary, and component tests | None |
| `pnpm test:coverage` | V8 coverage with HTML, LCOV, and Cobertura reports in `coverage/` | None |
| `pnpm test:e2e:public` | Public browser regressions against a local Next.js server | None |
| `pnpm test:a11y` | Automated WCAG A/AA checks for public and authentication flows | None |
| `pnpm db:start` + `pnpm test:db` | Fresh local Supabase migrations, RLS policies, and integrity triggers through pgTAP | Docker only |
| `pnpm test:e2e:auth` | Authenticated browser flows against local Supabase | Docker only; the account is created and removed per run |

`test:e2e:auth` refuses non-local Supabase URLs. Its temporary user has a `local.test` address and no delivery tests invoke Resend. Do not point browser tests at a personal, staging, or production Supabase project.

The database and authenticated-browser commands require Docker or a compatible container runtime. Start the local stack once with `pnpm db:start`; stop it with `pnpm db:stop` when finished.

## Coverage policy

Coverage is enforced for pure, high-risk utility modules: capability signing, share slugs, cron authorization, calendar dates, schemas, delivery routing, profile parsing, geocoding, email templates, and calendar subscriptions. The gate requires 80% lines/functions/statements and 70% branches across this scope.

The suite intentionally does not use a repository-wide percentage: it would either punish untestable framework glue or invite denominator games. Add a module to the measured scope when its test seam is established, then keep the threshold at or above its demonstrated baseline.

## CI and review requirements

The CI workflow publishes coverage and Playwright reports for 14 days. The separate CodeQL workflow scans TypeScript/JavaScript on pull requests, `main`, and weekly.

After merging this change, configure the `main` branch rule to require these checks before merge:

- `Quality gates`
- `Browser and accessibility`
- `Database policy tests`
- `Authenticated browser tests`
- `CodeQL`

Also require one approving review and dismiss stale approvals on new commits. These repository settings are intentionally not encoded in source control.

## Writing tests

- Test behavior and security boundaries, not implementation details.
- Use role/name locators in Playwright; avoid arbitrary delays and CSS-only selectors.
- Keep public browser cases anonymous. Tag logged-in cases with `@authenticated`.
- Add pgTAP coverage whenever a migration changes RLS, a trigger, or a cross-tenant relationship.
- Mock email and geocoding at the boundary in Vitest; use no real external delivery endpoint in CI.
- Keep screenshots, videos, traces, and coverage out of Git. CI retains failure artifacts automatically.
