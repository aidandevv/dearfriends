import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createShareCapability } from '@/lib/share-capability'
import { submitPublicContact } from './contacts'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/geocode', () => ({
  geocodeAddress: vi.fn(async () => null),
}))

vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(() => ({ emails: { send: vi.fn(async () => ({ data: {}, error: null })) } })),
  buildNoteNotificationEmail: vi.fn(() => ({ subject: 'note', html: '<p>note</p>' })),
  buildAddressRefreshEmail: vi.fn(() => ({ subject: 'refresh', html: '<p>refresh</p>' })),
}))

const state = {
  existingContact: null as null | { id: string },
  insertedContact: null as null | Record<string, unknown>,
  group: null as null | { id: string },
  groupAssignment: null as null | Record<string, unknown>,
}

class QueryBuilder {
  private mode: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select'
  private filters: Record<string, unknown> = {}

  constructor(private table: string, private payload?: Record<string, unknown>) {}

  select() { return this }
  single() { return this.maybeSingle() }
  order() { return this }
  delete() { this.mode = 'delete'; return this }
  update(payload: Record<string, unknown>) { this.mode = 'update'; this.payload = payload; return this }
  insert(payload: Record<string, unknown>) { this.mode = 'insert'; this.payload = payload; return this }
  upsert(payload: Record<string, unknown>) {
    this.mode = 'upsert'
    this.payload = payload
    if (this.table === 'contact_groups') state.groupAssignment = payload
    return this
  }
  eq(column: string, value: unknown) { this.filters[column] = value; return this }

  async maybeSingle() {
    if (this.table === 'contacts' && this.mode === 'select') return { data: state.existingContact, error: null }
    if (this.table === 'groups' && this.mode === 'select') return { data: state.group, error: null }
    if (this.table === 'contacts' && this.mode === 'insert') {
      state.insertedContact = this.payload ?? null
      return { data: { id: 'new-contact' }, error: null }
    }
    return { data: null, error: null }
  }
}

const supabase = {
  from: vi.fn((table: string) => new QueryBuilder(table)),
  auth: {
    admin: {
      getUserById: vi.fn(async () => ({ data: { user: { email: 'admin@example.com', user_metadata: { full_name: 'Admin User' } } } })),
    },
  },
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => supabase),
  createClient: vi.fn(async () => supabase),
}))

function validContact() {
  return {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    address_line_1: '1 Main',
    city: 'London',
    state: 'TX',
    zip: '12345',
    delivery_method: 'digital',
    tags: ['attacker-controlled'],
  }
}

describe('submitPublicContact', () => {
  const originalSecret = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-signing-secret'
    state.existingContact = null
    state.insertedContact = null
    state.group = null
    state.groupAssignment = null
    supabase.from.mockClear()
  })

  afterEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalSecret
  })

  it('rejects tampered capabilities', async () => {
    await expect(submitPublicContact('not-a-token', validContact())).resolves.toMatchObject({
      error: expect.stringContaining('expired'),
    })
    expect(state.insertedContact).toBeNull()
  })

  it('inserts new contacts without returning a raw contact id or trusting public-only fields', async () => {
    const token = createShareCapability({ adminId: 'admin-1', groupId: null })
    const result = await submitPublicContact(token, validContact())

    expect(result).toEqual({ success: true })
    expect(state.insertedContact).toMatchObject({
      admin_id: 'admin-1',
      email: 'ada@example.com',
      delivery_method: 'print',
      tags: [],
    })
    expect(result).not.toHaveProperty('contactId')
  })

  it('does not overwrite existing contacts for the same admin and email', async () => {
    state.existingContact = { id: 'existing-contact' }
    const token = createShareCapability({ adminId: 'admin-1', groupId: null })
    const result = await submitPublicContact(token, validContact())

    expect(result).toEqual({ success: true, alreadyExists: true })
    expect(state.insertedContact).toBeNull()
  })

  it('assigns only the group carried by the signed capability', async () => {
    state.group = { id: 'group-1' }
    const token = createShareCapability({ adminId: 'admin-1', groupId: 'group-1' })
    await expect(submitPublicContact(token, validContact())).resolves.toEqual({ success: true })
    expect(state.groupAssignment).toEqual({ contact_id: 'new-contact', group_id: 'group-1' })
  })
})
