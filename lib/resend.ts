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

const emailStyles = {
  body: "margin:0;padding:0;background:#FAF7F1;font-family:Georgia,'Times New Roman',serif",
  outer: 'background:#FAF7F1;padding:40px 16px',
  card: 'max-width:560px;background:#FFFFFF;border:1px solid #DDD0BC;border-radius:12px;overflow:hidden',
  header: 'padding:28px 36px 24px;border-bottom:1px solid #DDD0BC',
  brand: "margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#231209;letter-spacing:0.02em",
  content: 'padding:32px 36px 28px;font-size:15px;line-height:1.7;color:#231209',
  footer: 'padding:20px 36px 24px;border-top:1px solid #DDD0BC;font-size:12px;color:#7A6352;line-height:1.6',
  button:
    'display:inline-block;padding:12px 28px;background:#C05C2E;color:#ffffff;text-decoration:none;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;font-weight:500;letter-spacing:0.01em',
}

function renderEmailButton(href: string, label: string) {
  return `<a href="${safeHref(href)}" style="${emailStyles.button}">${escapeHtml(label)}</a>`
}

function renderBrandedEmail(content: string, footer = 'Dear Friends') {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="${emailStyles.body}">
      <table width="100%" cellpadding="0" cellspacing="0" style="${emailStyles.outer}">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="${emailStyles.card}">
            <tr>
              <td style="${emailStyles.header}">
                <p style="${emailStyles.brand}">Dear Friends</p>
              </td>
            </tr>
            <tr>
              <td style="${emailStyles.content}">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="${emailStyles.footer}">
                ${footer}
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `
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
  const senderLine = opts.adminName
    ? `<p style="margin:0 0 12px">${escapedAdminName} is double-checking their mailing list and asked if you could confirm your address.</p>`
    : '<p style="margin:0 0 12px">Please confirm your mailing address (or update it / opt out) using the link below:</p>'

  return {
    subject: opts.adminName ? `${opts.adminName} asked you to verify your address` : 'Please verify your address',
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi ${escapedFirstName},</p>
      ${senderLine}
      <p style="margin:20px 0 0">${renderEmailButton(opts.verifyUrl, 'Verify / Update / Opt out')}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#7A6352">This link is unique to you.</p>
    `),
  }
}

export function buildLetterEmail(opts: {
  subject: string
  body: string
}): { subject: string; html: string } {
  return {
    subject: opts.subject,
    html: renderBrandedEmail(renderLetterMarkdown(opts.body), 'Sent with Dear Friends'),
  }
}

export function buildNoteNotificationEmail(opts: {
  recipientFirstName: string
  note: string
  adminName: string | null
}): { subject: string; html: string } {
  return {
    subject: `${opts.recipientFirstName} left you a note`,
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi${opts.adminName ? ` ${escapeHtml(opts.adminName)}` : ''},</p>
      <p style="margin:0 0 16px"><strong>${escapeHtml(opts.recipientFirstName)}</strong> left you a note after submitting their address:</p>
      <blockquote style="margin:0;border-left:3px solid #C05C2E;padding-left:1em;color:#7A6352">${escapeHtml(opts.note)}</blockquote>
    `),
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
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi ${escapedFirstName},</p>
      <p style="margin:0 0 12px">${escapedFrom} is updating their address book and wants to make sure they have your current address.</p>
      <p style="margin:0 0 20px">Mind taking 30 seconds to confirm (or update) it?</p>
      <p style="margin:0">${renderEmailButton(opts.refreshUrl, 'Confirm my address')}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#7A6352">This link is unique to you.</p>
    `),
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
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi${escapedName},</p>
      <p style="margin:0 0 12px"><strong>${escapedTitle}</strong>${escapedContact ? ` for ${escapedContact}` : ''} is coming up on <strong>${escapeHtml(opts.occurrenceDate)}</strong>.</p>
      <p style="margin:0 0 20px">Based on ${escapeHtml(opts.offsetLabel.toLowerCase())}, Dear Friends estimates you should mail something by <strong>${escapeHtml(opts.mailByDate)}</strong>.</p>
      <p style="margin:0;font-size:13px;color:#7A6352">Delivery offset: ${opts.offsetDays} days &middot; Event type: ${escapeHtml(opts.eventType)}</p>
    `),
  }
}

export function buildAnniversaryReminderEmail(opts: {
  adminName?: string | null
  yearsSinceFirstSend: number
  composeUrl: string
}): { subject: string; html: string } {
  const escapedName = opts.adminName ? ` ${escapeHtml(opts.adminName)}` : ''
  const yearLabel = opts.yearsSinceFirstSend === 1 ? 'a year' : `${opts.yearsSinceFirstSend} years`

  return {
    subject: `Time to write again? It's been ${yearLabel}`,
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi${escapedName},</p>
      <p style="margin:0 0 20px">You sent your first letters through Dear Friends about <strong>${yearLabel} ago</strong>. Want to draft this year's note?</p>
      <p style="margin:0">${renderEmailButton(opts.composeUrl, 'Open composer')}</p>
    `),
  }
}

export function buildBirthdayDigestEmail(opts: {
  adminName?: string | null
  birthdays: Array<{ name: string; label: string }>
}): { subject: string; html: string } {
  const escapedName = opts.adminName ? ` ${escapeHtml(opts.adminName)}` : ''
  const items = opts.birthdays
    .map(entry => `<li><strong>${escapeHtml(entry.name)}</strong> — ${escapeHtml(entry.label)}</li>`)
    .join('')

  return {
    subject: `Upcoming birthdays this week (${opts.birthdays.length})`,
    html: renderBrandedEmail(`
      <p style="margin:0 0 12px">Hi${escapedName},</p>
      <p style="margin:0 0 12px">Here are the birthdays coming up in the next week for groups you're tracking:</p>
      <ul style="margin:0;padding-left:20px">${items}</ul>
    `),
  }
}
