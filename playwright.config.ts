import { defineConfig, devices } from '@playwright/test'

const PORT = 3005
const baseURL = `http://127.0.0.1:${PORT}`
const isCI = Boolean(process.env.CI)
const testEnvironment = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? baseURL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ci-placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'ci-placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'ci-placeholder-service-role-key',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? 're_ci_placeholder',
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? 'ci@example.com',
  CRON_SECRET: process.env.CRON_SECRET ?? 'ci-cron-secret',
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  timeout: isCI ? 60000 : 30000,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: isCI
      ? `./node_modules/.bin/next start --hostname 127.0.0.1 --port ${PORT}`
      : `./node_modules/.bin/next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    env: { ...process.env, ...testEnvironment },
    reuseExistingServer: !isCI,
    timeout: isCI ? 180000 : 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],
})
