import { Resend } from 'resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function safeHref(url: string) {
  const trimmed = url.trim()
  return /^(https?:|mailto:)/i.test(trimmed) ? escapeHtml(trimmed) : '#'
}

function renderInlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => `<a href="${safeHref(href)}">${label}</a>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)(?<!\s)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_(?!\s)(.+?)(?<!\s)_/g, '$1<em>$2</em>')
}

function renderLetterMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let paragraph: string[] = []
  let listItems: string[] = []
  let orderedList = false

  function flushParagraph() {
    if (!paragraph.length) return
    html.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br/>')}</p>`)
    paragraph = []
  }

  function flushList() {
    if (!listItems.length) return
    html.push(`<${orderedList ? 'ol' : 'ul'}>${listItems.join('')}</${orderedList ? 'ol' : 'ul'}>`)
    listItems = []
  }

  for (const line of lines) {
    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`)
      continue
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/)
    if (unordered || ordered) {
      flushParagraph()
      const isOrdered = Boolean(ordered)
      if (listItems.length && orderedList !== isOrdered) flushList()
      orderedList = isOrdered
      listItems.push(`<li>${renderInlineMarkdown((ordered ?? unordered)?.[1] ?? '')}</li>`)
      continue
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      flushParagraph()
      flushList()
      html.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`)
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return html.join('\n')
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
  const escapedFirstName = escapeHtml(opts.firstName)
  const escapedAdminName = opts.adminName ? escapeHtml(opts.adminName) : null
  const href = safeHref(opts.verifyUrl)
  const senderLine = opts.adminName
    ? `<p>${escapedAdminName} is double-checking their mailing list and asked if you could confirm your address.</p>`
    : '<p>Please confirm your mailing address (or update it / opt out) using the link below:</p>'

  return {
    subject: opts.adminName ? `${opts.adminName} asked you to verify your address` : 'Please verify your address',
    html: `
      <p>Hi ${escapedFirstName},</p>
      ${senderLine}
      <p><a href="${href}">Verify / Update / Opt out</a></p>
      <p>This link is unique to you.</p>
    `,
  }
}

export function buildLetterEmail(opts: {
  subject: string
  body: string
}): { subject: string; html: string } {
  return {
    subject: opts.subject,
    html: renderLetterMarkdown(opts.body),
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

export function buildCalendarReminderEmail(opts: {
  adminName?: string | null
  title: string
  eventType: string
  occurrenceDate: string
  mailByDate: string
  offsetLabel: string
  offsetDays: number
  contactName: string | null
}): { subject: string; html: string } {
  const escapedTitle = escapeHtml(opts.title)
  const escapedName = opts.adminName ? ` ${escapeHtml(opts.adminName)}` : ''
  const escapedContact = opts.contactName ? escapeHtml(opts.contactName) : null

  return {
    subject: `Mail by ${opts.mailByDate}: ${opts.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1d2442;line-height:1.6">
        <p>Hi${escapedName},</p>
        <p><strong>${escapedTitle}</strong>${escapedContact ? ` for ${escapedContact}` : ''} is coming up on <strong>${opts.occurrenceDate}</strong>.</p>
        <p>Based on ${escapeHtml(opts.offsetLabel.toLowerCase())}, dearfriends estimates you should mail something by <strong>${opts.mailByDate}</strong>.</p>
        <p style="font-size:13px;color:#6b7290">Delivery offset: ${opts.offsetDays} days · Event type: ${escapeHtml(opts.eventType)}</p>
      </div>
    `,
  }
}
