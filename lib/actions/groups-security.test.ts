import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setContactGroups } from './groups'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

const state = {
  user: { id: 'admin-1' } as null | { id: string },
  contactVisible: true,
  ownedGroups: ['group-1'] as string[],
  insertedRows: null as null | Array<{ contact_id: string; group_id: string }>,
  deletedContactId: null as null | string,
}

class QueryBuilder {
  private filters: Record<string, unknown> = {}
  private inValues: string[] = []
  private mode: 'select' | 'insert' | 'delete' = 'select'

  constructor(private table: string, private payload?: Array<{ contact_id: string; group_id: string }>) {}

  select() { return this }
  eq(column: string, value: unknown) { this.filters[column] = value; return this }
  in(_column: string, values: string[]) { this.inValues = values; return this }
  delete() { this.mode = 'delete'; return this }
  insert(payload: Array<{ contact_id: string; group_id: string }>) {
    this.mode = 'insert'
    this.payload = payload
    state.insertedRows = payload
    return Promise.resolve({ error: null })
  }

  async maybeSingle() {
    if (this.table === 'contacts') {
      return { data: state.contactVisible ? { id: this.filters.id } : null, error: null }
    }
    return { data: null, error: null }
  }

  then(resolve: (value: { data?: unknown; error: null }) => void) {
    if (this.mode === 'delete') {
      state.deletedContactId = this.filters.contact_id as string
      resolve({ error: null })
      return
    }

    if (this.table === 'groups') {
      resolve({
        data: this.inValues
          .filter(id => state.ownedGroups.includes(id))
          .map(id => ({ id })),
        error: null,
      })
      return
    }

    resolve({ data: null, error: null })
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
}))

describe('setContactGroups security boundary', () => {
  beforeEach(() => {
    state.user = { id: 'admin-1' }
    state.contactVisible = true
    state.ownedGroups = ['group-1']
    state.insertedRows = null
    state.deletedContactId = null
    supabase.from.mockClear()
  })

  it('rejects unowned group ids before inserting memberships', async () => {
    await expect(setContactGroups('contact-1', ['group-1', 'victim-group'])).resolves.toEqual({
      error: 'One or more groups were not found.',
    })

    expect(state.insertedRows).toBeNull()
    expect(state.deletedContactId).toBeNull()
  })

  it('allows owned contacts to be assigned only to owned groups', async () => {
    await expect(setContactGroups('contact-1', ['group-1', 'group-1'])).resolves.toEqual({
      success: true,
    })

    expect(state.deletedContactId).toBeNull()
    expect(state.insertedRows).toEqual([{ contact_id: 'contact-1', group_id: 'group-1' }])
  })
})
