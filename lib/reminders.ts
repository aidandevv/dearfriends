export type UpcomingBirthday = {
  firstName: string
  lastName: string
  label: string
}

export function daysUntilNextAnniversary(firstSentAt: Date, today = new Date()): number {
  const month = firstSentAt.getMonth()
  const day = firstSentAt.getDate()
  const anniversary = new Date(today.getFullYear(), month, day)
  if (anniversary < startOfDay(today)) {
    anniversary.setFullYear(anniversary.getFullYear() + 1)
  }
  return Math.round((anniversary.getTime() - startOfDay(today).getTime()) / 86_400_000)
}

export function anniversaryReminderYear(firstSentAtIso: string, today = new Date()): number {
  const firstSentAt = new Date(firstSentAtIso)
  const anniversaryThisYear = new Date(today.getFullYear(), firstSentAt.getMonth(), firstSentAt.getDate())
  return anniversaryThisYear < startOfDay(today) ? today.getFullYear() + 1 : today.getFullYear()
}

export function shouldSendAnniversaryReminder(
  firstSentAtIso: string,
  lastReminderYear: number | null | undefined,
  today = new Date(),
): boolean {
  const firstSentAt = new Date(firstSentAtIso)
  if (Number.isNaN(firstSentAt.getTime())) return false

  const daysUntil = daysUntilNextAnniversary(firstSentAt, today)
  if (daysUntil > 14) return false

  const targetYear = anniversaryReminderYear(firstSentAtIso, today)
  return lastReminderYear !== targetYear
}

export function parseBirthdayMonthDay(birthdayIso: string): { month: number; day: number } | null {
  const datePart = birthdayIso.split('T')[0]
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return null
  return { month: month - 1, day }
}

export function isBirthdayWithinDays(birthdayIso: string, days: number, today = new Date()): boolean {
  const parts = parseBirthdayMonthDay(birthdayIso)
  if (!parts) return false

  for (let offset = 0; offset <= days; offset++) {
    const target = new Date(today)
    target.setDate(target.getDate() + offset)
    if (parts.month === target.getMonth() && parts.day === target.getDate()) {
      return true
    }
  }
  return false
}

export function formatBirthdayLabel(birthdayIso: string, today = new Date()): string {
  const parts = parseBirthdayMonthDay(birthdayIso)
  if (!parts) return birthdayIso

  for (let offset = 0; offset <= 7; offset++) {
    const target = new Date(today)
    target.setDate(target.getDate() + offset)
    if (parts.month === target.getMonth() && parts.day === target.getDate()) {
      return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const fallback = new Date(today.getFullYear(), parts.month, parts.day)
  return fallback.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function isoWeekKey(date = new Date()): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
