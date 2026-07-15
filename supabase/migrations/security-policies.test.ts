import { readFileSync, readdirSync } from 'fs'
import { describe, expect, it } from 'vitest'

describe('public verification RLS hardening migration', () => {
  it('drops the anonymous contact update policy', () => {
    const migration = readFileSync('supabase/migrations/010_harden_public_verification.sql', 'utf8')
    expect(migration).toContain('drop policy if exists "public_verify_update" on public.contacts')
  })
})

describe('cross-tenant relationship hardening migration', () => {
  it('requires contact group rows to link a contact and group owned by the same admin', () => {
    const migration = readFileSync('supabase/migrations/011_harden_cross_tenant_relationships.sql', 'utf8')
    expect(migration).toContain('join public.groups g on g.id = group_id')
    expect(migration).toContain('and c.admin_id = auth.uid()')
    expect(migration).toContain('and g.admin_id = auth.uid()')
    expect(migration).toContain('enforce_contact_group_same_admin')
  })

  it('requires linked calendar contacts to belong to the event admin', () => {
    const migration = readFileSync('supabase/migrations/011_harden_cross_tenant_relationships.sql', 'utf8')
    expect(migration).toContain('enforce_calendar_event_contact_same_admin')
    expect(migration).toContain('and c.admin_id = new.admin_id')
  })
})

describe('migration history', () => {
  it('uses one ordered version per SQL migration', () => {
    const files = readdirSync('supabase/migrations')
      .filter(file => /^\d+_.+\.sql$/.test(file))
      .sort()
    const versions = files.map(file => Number(file.split('_', 1)[0]))

    expect(versions).toEqual(Array.from({ length: 12 }, (_, index) => index + 1))
    expect(new Set(versions).size).toBe(versions.length)
  })

  it('keeps the coordinate migration safe to replay', () => {
    const migration = readFileSync('supabase/migrations/006_add_lat_lng_to_contacts.sql', 'utf8')
    expect(migration).toContain('add column if not exists lat')
    expect(migration).toContain('add column if not exists lng')
  })
})
