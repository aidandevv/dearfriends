import { afterEach, describe, expect, it } from 'vitest'
import { isCronAuthorized } from './cron-auth'

describe('isCronAuthorized', () => {
  const originalSecret = process.env.CRON_SECRET

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('fails closed when CRON_SECRET is missing', () => {
    delete process.env.CRON_SECRET
    expect(isCronAuthorized('Bearer undefined')).toBe(false)
  })

  it('fails closed when CRON_SECRET is blank', () => {
    process.env.CRON_SECRET = '   '
    expect(isCronAuthorized('Bearer ')).toBe(false)
  })

  it('rejects wrong headers', () => {
    process.env.CRON_SECRET = 'expected-secret'
    expect(isCronAuthorized('Bearer wrong')).toBe(false)
  })

  it('accepts the exact non-empty bearer secret', () => {
    process.env.CRON_SECRET = 'expected-secret'
    expect(isCronAuthorized('Bearer expected-secret')).toBe(true)
  })
})
