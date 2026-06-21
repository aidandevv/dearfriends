import { createHash, timingSafeEqual } from 'crypto'

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false

  const expected = `Bearer ${secret}`
  const received = authHeader ?? ''

  return timingSafeEqual(digest(received), digest(expected)) && received === expected
}
