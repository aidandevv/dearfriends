import { describe, expect, it } from 'vitest'
import {
  buildAddressRefreshEmail,
  buildAnniversaryReminderEmail,
  buildBirthdayDigestEmail,
  buildCalendarReminderEmail,
  buildLetterEmail,
  buildNoteNotificationEmail,
  buildVerificationEmail,
} from './resend'

function expectBrandedEmail(html: string) {
  expect(html).toContain('<!DOCTYPE html>')
  expect(html).toContain('Dear Friends')
  expect(html).toContain('background:#FAF7F1')
  expect(html).toContain('border:1px solid #DDD0BC')
}

describe('buildVerificationEmail', () => {
  it('escapes interpolated names and sanitizes unsafe links', () => {
    const email = buildVerificationEmail({
      firstName: '<img src=x>',
      adminName: '<b>Ada</b>',
      verifyUrl: 'javascript:alert(1)',
    })

    expect(email.html).toContain('&lt;img src=x&gt;')
    expect(email.html).toContain('&lt;b&gt;Ada&lt;/b&gt;')
    expect(email.html).toContain('href="#"')
    expect(email.html).not.toContain('<img src=x>')
    expectBrandedEmail(email.html)
  })

  it('keeps safe verification links intact inside the branded button', () => {
    const email = buildVerificationEmail({
      firstName: 'Ada',
      verifyUrl: 'https://example.com/verify?token=a&next=b',
    })

    expect(email.html).toContain('href="https://example.com/verify?token=a&amp;next=b"')
    expect(email.html).toContain('Verify / Update / Opt out')
  })
})

describe('resend branded templates', () => {
  it('brands every Resend email builder', () => {
    const emails = [
      buildVerificationEmail({ firstName: 'Ada', verifyUrl: 'https://example.com/verify' }),
      buildLetterEmail({ subject: 'Hello', body: 'A small **note**.' }),
      buildNoteNotificationEmail({ recipientFirstName: 'Grace', note: 'Miss you!', adminName: 'Ada' }),
      buildAddressRefreshEmail({ firstName: 'Grace', refreshUrl: 'https://example.com/refresh', adminName: 'Ada' }),
      buildCalendarReminderEmail({
        adminName: 'Ada',
        title: 'Grace birthday',
        eventType: 'birthday',
        occurrenceDate: 'July 1',
        mailByDate: 'June 24',
        offsetLabel: '1 week before',
        offsetDays: 7,
        contactName: 'Grace',
      }),
      buildAnniversaryReminderEmail({
        adminName: 'Ada',
        yearsSinceFirstSend: 2,
        composeUrl: 'https://example.com/dashboard/compose',
      }),
      buildBirthdayDigestEmail({
        adminName: 'Ada',
        birthdays: [{ name: 'Grace', label: 'Friday' }],
      }),
    ]

    for (const email of emails) {
      expectBrandedEmail(email.html)
    }
  })

  it('sanitizes address refresh links in branded buttons', () => {
    const email = buildAddressRefreshEmail({
      firstName: 'Grace',
      refreshUrl: 'javascript:alert(1)',
      adminName: 'Ada',
    })

    expect(email.html).toContain('href="#"')
    expect(email.html).not.toContain('javascript:alert')
  })
})
