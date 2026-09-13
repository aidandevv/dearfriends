import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateAdminClient } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: mockCreateAdminClient,
}))

import {
  countShareSlugsForAdmin,
  generateShareSlugForUser,
  isShareSlugTaken,
  resolveShareSlug,
  resolveSlugToAdminId,
} from './share-slugs'

type User = {
  id: string
  user_metadata?: Record<string, unknown>
}

function useAdminClient({
  userPages = [[]] as User[][],
  group = null as { id: string; admin_id: string } | null,
  groupSlugs = [] as { id: string }[],
  usersById = {} as Record<string, User>,
  groupSlugCount = 0,
  updateError = null as Error | null,
} = {}) {
  const listUsers = vi.fn(async ({ page }: { page: number }) => ({
    data: { users: userPages[page - 1] ?? [] },
    error: null,
  }))
  const getUserById = vi.fn(async (userId: string) => ({
    data: { user: usersById[userId] ?? null },
  }))
  const updateUserById = vi.fn(async () => ({ error: updateError }))
  const from = vi.fn(() => ({
    select: vi.fn((columns: string, options?: { head?: boolean }) => {
      if (options?.head) {
        return {
          eq: vi.fn(() => ({
            not: vi.fn().mockResolvedValue({ count: groupSlugCount }),
          })),
        }
      }

      const data = columns.includes('admin_id') ? group : groupSlugs
      const query = Object.assign(Promise.resolve({ data }), {
        maybeSingle: vi.fn().mockResolvedValue({ data }),
      })
      return { eq: vi.fn(() => query) }
    }),
  }))

  mockCreateAdminClient.mockReturnValue({
    auth: { admin: { listUsers, getUserById, updateUserById } },
    from,
  })

  return { from, getUserById, listUsers, updateUserById }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('share-slug resolution', () => {
  it('resolves a case-insensitive personal slug and its admin id', async () => {
    useAdminClient({
      userPages: [[{ id: 'owner-1', user_metadata: { share_slug: 'ada-friends' } }]],
    })

    await expect(resolveShareSlug('ADA-FRIENDS')).resolves.toEqual({
      adminId: 'owner-1',
      groupId: null,
    })
    await expect(resolveSlugToAdminId('ada-friends')).resolves.toBe('owner-1')
  })

  it('checks additional auth pages before resolving a group slug', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `user-${index}`,
      user_metadata: {},
    }))
    const { listUsers } = useAdminClient({
      userPages: [firstPage, []],
      group: { id: 'group-1', admin_id: 'owner-2' },
    })

    await expect(resolveShareSlug('book-club')).resolves.toEqual({
      adminId: 'owner-2',
      groupId: 'group-1',
    })
    expect(listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 1000 })
    expect(listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 1000 })
  })

  it('returns null when neither a user nor group owns the slug', async () => {
    useAdminClient()

    await expect(resolveShareSlug('missing')).resolves.toBeNull()
    await expect(resolveSlugToAdminId('missing')).resolves.toBeNull()
  })
})

describe('share-slug conflicts', () => {
  it('recognises user and group conflicts while respecting excluded records', async () => {
    useAdminClient({
      userPages: [[{ id: 'owner-1', user_metadata: { share_slug: 'ada-friends' } }]],
      groupSlugs: [{ id: 'group-1' }],
    })

    await expect(isShareSlugTaken('ADA-FRIENDS')).resolves.toBe(true)
    await expect(isShareSlugTaken('ada-friends', { excludingUserId: 'owner-1' })).resolves.toBe(true)
    await expect(isShareSlugTaken('ada-friends', {
      excludingUserId: 'owner-1',
      excludingGroupId: 'group-1',
    })).resolves.toBe(false)
  })
})

describe('share-slug limits and generation', () => {
  it('counts a non-empty primary slug plus group slugs', async () => {
    useAdminClient({
      usersById: { 'owner-1': { id: 'owner-1', user_metadata: { share_slug: 'ada-friends' } } },
      groupSlugCount: 2,
    })

    await expect(countShareSlugsForAdmin('owner-1')).resolves.toBe(3)
  })

  it('does not count a whitespace-only primary slug', async () => {
    useAdminClient({
      usersById: { 'owner-1': { id: 'owner-1', user_metadata: { share_slug: '  ' } } },
    })

    await expect(countShareSlugsForAdmin('owner-1')).resolves.toBe(0)
  })

  it('creates an available slug and preserves existing user metadata', async () => {
    const { updateUserById } = useAdminClient({
      usersById: { 'owner-1': { id: 'owner-1', user_metadata: { full_name: 'Ada' } } },
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await expect(generateShareSlugForUser('owner-1')).resolves.toBe('aaaaaaaa')
    expect(updateUserById).toHaveBeenCalledWith('owner-1', {
      user_metadata: { full_name: 'Ada', share_slug: 'aaaaaaaa' },
    })
  })

  it('rejects generation at the user limit and when the update fails', async () => {
    useAdminClient({
      usersById: { 'owner-1': { id: 'owner-1', user_metadata: { share_slug: 'ada' } } },
      groupSlugCount: 9,
    })
    await expect(generateShareSlugForUser('owner-1')).rejects.toThrow('up to 10 share slugs')

    useAdminClient({
      usersById: { 'owner-1': { id: 'owner-1', user_metadata: {} } },
      updateError: new Error('database unavailable'),
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)
    await expect(generateShareSlugForUser('owner-1')).rejects.toThrow('database unavailable')
  })

  it('gives up after three generated conflicts', async () => {
    useAdminClient({
      userPages: [[{ id: 'other-owner', user_metadata: { share_slug: 'aaaaaaaa' } }]],
    })
    vi.spyOn(Math, 'random').mockReturnValue(0)

    await expect(generateShareSlugForUser('owner-1')).rejects.toThrow(
      'Could not generate a unique share slug after 3 attempts',
    )
  })
})
