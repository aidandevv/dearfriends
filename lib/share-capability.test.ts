import { afterEach, describe, expect, it } from 'vitest'
import { createShareCapability, verifyShareCapability } from './share-capability'

describe('share capabilities', () => {
  const originalSecret = process.env.SUPABASE_SERVICE_ROLE_KEY

  afterEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalSecret
  })

  it('round trips admin and group ids', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'signing-secret'
    const token = createShareCapability({ adminId: 'admin-1', groupId: 'group-1' }, 1_000)
    expect(verifyShareCapability(token, 2_000)).toEqual({ adminId: 'admin-1', groupId: 'group-1' })
  })

  it('rejects tampered tokens', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'signing-secret'
    const token = createShareCapability({ adminId: 'admin-1', groupId: null })
    expect(verifyShareCapability(`${token}x`)).toBeNull()
  })

  it('rejects expired tokens', () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'signing-secret'
    const token = createShareCapability({ adminId: 'admin-1', groupId: null }, 1_000)
    expect(verifyShareCapability(token, 25 * 60 * 60 * 1000 + 1_001)).toBeNull()
  })
})
