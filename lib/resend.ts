import { Resend } from 'resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

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

export function buildNoteNotificationEmail(opts: {
  recipientFirstName: string
  note: string
  adminName: string | null
}): { subject: string; html: string } {
  return {
    subject: `${opts.recipientFirstName} left you a note`,
    html: `
      <p>Hi${opts.adminName ? ` ${escapeHtml(opts.adminName)}` : ''},</p>
      <p><strong>${escapeHtml(opts.recipientFirstName)}</strong> left you a note after submitting their address:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${escapeHtml(opts.note)}</blockquote>
    `,
  }
}

export function buildAddressRefreshEmail(opts: {
  firstName: string
  refreshUrl: string
  adminName: string | null
}): { subject: string; html: string } {
  const from = opts.adminName ?? 'Someone'
  const escapedFrom = escapeHtml(from)
  const escapedFirstName = escapeHtml(opts.firstName)
  return {
    subject: `${from} wants to confirm your address`,
    html: `
      <p>Hi ${escapedFirstName},</p>
      <p>${escapedFrom} is updating their address book and wants to make sure they have your current address.</p>
      <p>Mind taking 30 seconds to confirm (or update) it?</p>
      <p><a href="${opts.refreshUrl}" style="background:#8B4513;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Confirm my address</a></p>
      <p style="font-size:12px;color:#999">This link is unique to you.</p>
    `,
  }
}
