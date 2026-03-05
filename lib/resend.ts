import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export function buildVerificationEmail(opts: {
  firstName: string
  verifyUrl: string
}): { subject: string; html: string } {
  return {
    subject: 'Please verify your address',
    html: `
      <p>Hi ${opts.firstName},</p>
      <p>Please confirm your mailing address (or update it / opt out) using the link below:</p>
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
