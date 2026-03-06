import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

/** @deprecated use getResend() instead */
export const resend = {
  emails: {
    send: (...args: Parameters<Resend['emails']['send']>) => getResend().emails.send(...args),
  },
}

export function buildVerificationEmail(opts: {
  firstName: string
  verifyUrl: string
  adminName?: string | null
}): { subject: string; html: string } {
  const senderLine = opts.adminName
    ? `<p>${opts.adminName} is double-checking their mailing list and asked if you could confirm your address.</p>`
    : '<p>Please confirm your mailing address (or update it / opt out) using the link below:</p>'

  return {
    subject: opts.adminName ? `${opts.adminName} asked you to verify your address` : 'Please verify your address',
    html: `
      <p>Hi ${opts.firstName},</p>
      ${senderLine}
      <p><a href="${opts.verifyUrl}">Verify / Update / Opt out</a></p>
      <p>This link is unique to you.</p>
    `,
  }
}

export function buildLetterEmail(opts: {
  subject: string
  body: string
}): { subject: string; html: string } {
  const htmlBody = opts.body
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return {
    subject: opts.subject,
    html: `<p>${htmlBody}</p>`,
  }
}
