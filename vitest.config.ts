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
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
