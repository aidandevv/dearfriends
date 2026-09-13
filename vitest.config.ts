import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // The suite exercises server-side actions, migrations, crypto, DNS, and
    // HTTPS code. Node keeps those built-ins available when Vercel runs the
    // checks with NODE_ENV=production.
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', 'e2e/**'],
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      include: [
        'lib/share-capability.ts',
        'lib/share-slugs.ts',
        'lib/cron-auth.ts',
        'lib/calendar-date.ts',
        'lib/delivery-methods.ts',
        'lib/schemas.ts',
        'lib/user-profile.ts',
        'lib/calendar-subscription.ts',
        'lib/geocode.ts',
        'lib/resend.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
