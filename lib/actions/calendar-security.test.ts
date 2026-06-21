import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCalendarEvent } from './calendar'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  getResend: vi.fn(),
  buildCalendarReminderEmail: vi.fn(),
}))

vi.mock('@/lib/calendar-subscription', () => ({
  fetchCalendarSubscription: vi.fn(),
}))

const state = {
  user: { id: 'admin-1' } as null | { id: string },
  contactVisible: true,
  insertedEvent: null as null | Record<string, unknown>,
}

class QueryBuilder {
  private filters: Record<string, unknown> = {}

  constructor(private table: string, private payload?: Record<string, unknown>) {}

  select() { return this }
  eq(column: string, value: unknown) { this.filters[column] = value; return this }

  insert(payload: Record<string, unknown>) {
    this.payload = payload
    if (this.table === 'calendar_events') state.insertedEvent = payload
    return Promise.resolve({ error: null })
  }

  async maybeSingle() {
    if (this.table === 'contacts') {
      return { data: state.contactVisible ? { id: this.filters.id } : null, error: null }
    }
    return { data: null, error: null }
  }
}

const supabase = {
  auth: {
    getUser: vi.fn(async () => ({ data: { user: state.user } })),
  },
  from: vi.fn((table: string) => new QueryBuilder(table)),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabase),
  createServiceClient: vi.fn(async () => supabase),
}))

function eventForm(contactId: string) {
  const form = new FormData()
  form.set('title', 'Birthday')
  form.set('event_type', 'birthday')
  form.set('event_date', '2026-01-01')
  form.set('recurrence', 'yearly')
  form.set('contact_id', contactId)
  return form
}

describe('createCalendarEvent security boundary', () => {
  beforeEach(() => {
    state.user = { id: 'admin-1' }
    state.contactVisible = true
    state.insertedEvent = null
    supabase.from.mockClear()
  })

  it('rejects contact ids that are not visible to the current admin', async () => {
    state.contactVisible = false

    await expect(createCalendarEvent(eventForm('00000000-0000-4000-8000-000000000001'))).resolves.toEqual({
      error: 'Contact not found.',
    })

    expect(state.insertedEvent).toBeNull()
  })

  it('allows events linked to contacts visible to the current admin', async () => {
    await expect(createCalendarEvent(eventForm('00000000-0000-4000-8000-000000000001'))).resolves.toEqual({
      success: true,
    })

    expect(state.insertedEvent).toMatchObject({
      contact_id: '00000000-0000-4000-8000-000000000001',
      source: 'manual',
    })
  })
})
