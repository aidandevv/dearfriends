import { describe, expect, it } from 'vitest'
import { dateKeyInTimeZone } from '@/lib/calendar-date'

describe('dateKeyInTimeZone', () => {
  it('uses the account timezone at UTC day boundaries', () => {
    const date = new Date('2026-07-15T00:30:00.000Z')
    expect(dateKeyInTimeZone(date, 'America/Los_Angeles')).toBe('2026-07-14')
    expect(dateKeyInTimeZone(date, 'Asia/Tokyo')).toBe('2026-07-15')
  })

  it('falls back to UTC for invalid stored timezone values', () => {
    expect(dateKeyInTimeZone(new Date('2026-07-15T23:30:00.000Z'), 'Not/A_Zone')).toBe('2026-07-15')
  })
})
