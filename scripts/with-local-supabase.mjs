import { execFileSync, spawnSync } from 'node:child_process'

const command = process.argv[2]
const args = process.argv.slice(3)

if (!command) {
  throw new Error('Usage: node scripts/with-local-supabase.mjs <command> [...args]')
}

const status = execFileSync('supabase', [
  'status',
  '--output', 'env',
  '--override-name', 'api.url=NEXT_PUBLIC_SUPABASE_URL',
  '--override-name', 'auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY',
  '--override-name', 'auth.service_role_key=SUPABASE_SERVICE_ROLE_KEY',
], { encoding: 'utf8' })

const supabaseEnv = Object.fromEntries(
  status
    .split('\n')
    .map(line => line.match(/^([A-Z0-9_]+)=(?:"(.*)"|(.*))$/))
    .filter(Boolean)
    .map(([, key, quoted, unquoted]) => [key, quoted ?? unquoted]),
)

const localUrl = supabaseEnv.NEXT_PUBLIC_SUPABASE_URL
if (!localUrl || !['127.0.0.1', 'localhost'].includes(new URL(localUrl).hostname)) {
  throw new Error('Start a local Supabase project with `pnpm db:start` before running authenticated E2E tests.')
}

const result = spawnSync(command, args, {
  env: {
    ...process.env,
    ...supabaseEnv,
    E2E_LOCAL_SUPABASE: 'true',
    E2E_USER_EMAIL: 'e2e.owner@local.test',
    E2E_USER_PASSWORD: 'test-only-password-123',
    NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3005',
    RESEND_API_KEY: 're_local_test',
    RESEND_FROM_EMAIL: 'e2e@local.test',
    CRON_SECRET: 'local-e2e-cron-secret',
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

process.exit(result.status ?? 1)
