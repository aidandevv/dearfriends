import { describe, it, expect } from 'vitest'
import { getUserProfile } from './user-profile'

describe('getUserProfile shareSlug', () => {
  it('returns shareSlug from metadata', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada', share_slug: 'ada123' } })
    expect(profile.shareSlug).toBe('ada123')
  })

  it('returns null when share_slug absent', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada' } })
    expect(profile.shareSlug).toBeNull()
  })

  it('returns null when share_slug is empty string', () => {
    const profile = getUserProfile({ user_metadata: { full_name: 'Ada', share_slug: '' } })
    expect(profile.shareSlug).toBeNull()
  })
})
