import { describe, expect, it } from 'vitest'
import { buildVerificationEmail } from './resend'

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
  })
})
