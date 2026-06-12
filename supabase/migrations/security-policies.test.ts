import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'

describe('public verification RLS hardening migration', () => {
  it('drops the anonymous contact update policy', () => {
    const migration = readFileSync('supabase/migrations/010_harden_public_verification.sql', 'utf8')
    expect(migration).toContain('drop policy if exists "public_verify_update" on public.contacts')
  })
})
