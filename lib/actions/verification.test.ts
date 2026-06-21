import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { handleVerifyToken } from './verification'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/geocode', () => ({
  geocodeAddress: vi.fn(async () => null),
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn() } },
  buildVerificationEmail: vi.fn(),
}))

const token = '11111111-1111-4111-8111-111111111111'
const now = new Date('2026-06-08T00:00:00.000Z').getTime()

const state = {
  contact: null as null | { id: string; verification_token: string; verification_sent_at: string | null },
  updatePayload: null as null | Record<string, unknown>,
}

let dateNowSpy: MockInstance<() => number>

class QueryBuilder {
  private mode: 'select' | 'update' | 'insert' = 'select'
  private filters: Record<string, unknown> = {}

  constructor(private table: string, private payload?: Record<string, unknown>) {}

  select() { return this }
  insert(payload: Record<string, unknown>) { this.mode = 'insert'; this.payload = payload; return this }
  update(payload: Record<string, unknown>) { this.mode = 'update'; this.payload = payload; return this }
  eq(column: string, value: unknown) { this.filters[column] = value; return this }

  async maybeSingle() {
    if (this.table !== 'contacts') return { data: null, error: null }
    if (this.mode === 'select') {
      return { data: state.contact?.verification_token === this.filters.verification_token ? state.contact : null, error: null }
    }
    if (
      this.mode === 'update' &&
      state.contact &&
      state.contact.id === this.filters.id &&
      state.contact.verification_token === this.filters.verification_token
    ) {
      state.updatePayload = this.payload ?? null
      state.contact.verification_token = String((this.payload ?? {}).verification_token ?? '')
      return { data: { id: state.contact.id }, error: null }
    }
    return { data: null, error: null }
  }

  async single() { return this.maybeSingle() }
}

const supabase = {
  from: vi.fn((table: string) => new QueryBuilder(table)),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(async () => supabase),
  createClient: vi.fn(async () => supabase),
}))

describe('handleVerifyToken', () => {
  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now)
    state.contact = {
      id: 'contact-1',
      verification_token: token,
      verification_sent_at: new Date(now - 60_000).toISOString(),
    }
    state.updatePayload = null
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
  })

  it('rejects invalid token formats before querying', async () => {
    await expect(handleVerifyToken('not-a-token', 'confirm')).resolves.toMatchObject({
      error: 'This verification link is invalid or has expired.',
    })
  })

  it('rejects expired tokens', async () => {
    state.contact!.verification_sent_at = new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString()
    await expect(handleVerifyToken(token, 'confirm')).resolves.toMatchObject({
      error: 'This verification link is invalid or has expired.',
    })
    expect(state.updatePayload).toBeNull()
  })

  it('confirms valid tokens once and clears the token', async () => {
    await expect(handleVerifyToken(token, 'confirm')).resolves.toEqual({ success: true })
    expect(state.updatePayload).toMatchObject({ verification_token: null })

    await expect(handleVerifyToken(token, 'confirm')).resolves.toMatchObject({
      error: 'This verification link is invalid or has expired.',
    })
  })

  it('strips unexpected fields during address updates', async () => {
    await expect(handleVerifyToken(token, 'update', {
      address_line_1: '2 Main',
      city: 'Paris',
      state: 'IDF',
      zip: '75001',
      admin_id: 'attacker',
      delivery_method: 'digital',
    } as never)).resolves.toEqual({ success: true })

    expect(state.updatePayload).toMatchObject({
      address_line_1: '2 Main',
      city: 'Paris',
      state: 'IDF',
      zip: '75001',
      verification_token: null,
    })
    expect(state.updatePayload).not.toHaveProperty('admin_id')
    expect(state.updatePayload).not.toHaveProperty('delivery_method')
  })
})
