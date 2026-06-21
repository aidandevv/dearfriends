import { describe, expect, it } from 'vitest'
import {
  anniversaryReminderYear,
  daysUntilNextAnniversary,
  formatBirthdayLabel,
  isBirthdayWithinDays,
  shouldSendAnniversaryReminder,
} from './reminders'

describe('anniversary reminders', () => {
  const firstSent = new Date(2024, 2, 1)

  it('counts days until the next anniversary', () => {
    expect(daysUntilNextAnniversary(firstSent, new Date(2026, 1, 20))).toBe(9)
    expect(daysUntilNextAnniversary(firstSent, new Date(2026, 2, 1))).toBe(0)
  })

  it('sends within 14 days and only once per target year', () => {
    const today = new Date(2026, 1, 20)
    expect(shouldSendAnniversaryReminder(firstSent.toISOString(), null, today)).toBe(true)
    expect(shouldSendAnniversaryReminder(firstSent.toISOString(), 2026, today)).toBe(false)
    expect(shouldSendAnniversaryReminder(firstSent.toISOString(), null, new Date(2026, 0, 1))).toBe(false)
  })

  it('uses the upcoming anniversary year after the date passes', () => {
    expect(anniversaryReminderYear(firstSent.toISOString(), new Date(2026, 2, 2))).toBe(2027)
  })
})

describe('birthday reminders', () => {
  it('matches birthdays in the next week by month/day', () => {
    expect(isBirthdayWithinDays('1990-03-15', 7, new Date('2026-03-10'))).toBe(true)
    expect(isBirthdayWithinDays('1990-03-15', 7, new Date('2026-03-01'))).toBe(false)
  })

  it('formats an upcoming birthday label without the year', () => {
    expect(formatBirthdayLabel('1990-03-15', new Date('2026-03-10'))).toBe('Mar 15')
  })
})
