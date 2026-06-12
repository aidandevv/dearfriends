import { afterEach, describe, expect, it } from 'vitest'
import { GET as sendVerifications } from './send-verifications/route'
import { GET as sendCalendarReminders } from './send-calendar-reminders/route'

describe('cron route authorization', () => {
  const originalSecret = process.env.CRON_SECRET

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret
  })

  it('rejects the fail-open undefined header on scheduled verification cron', async () => {
    delete process.env.CRON_SECRET
    const response = await sendVerifications(new Request('http://localhost/api/cron/send-verifications', {
      headers: { authorization: 'Bearer undefined' },
    }))
    expect(response.status).toBe(401)
  })

  it('rejects the fail-open undefined header on calendar reminder cron', async () => {
    delete process.env.CRON_SECRET
    const response = await sendCalendarReminders(new Request('http://localhost/api/cron/send-calendar-reminders', {
      headers: { authorization: 'Bearer undefined' },
    }))
    expect(response.status).toBe(401)
  })
})
