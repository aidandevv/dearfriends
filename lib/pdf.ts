import { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { interpolate } from './utils'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.6 },
  body: { display: 'flex', flexDirection: 'column', gap: 8 },
  paragraph: { fontSize: 12, lineHeight: 1.6 },
  h1: { fontSize: 22, lineHeight: 1.25, marginBottom: 6 },
  h2: { fontSize: 17, lineHeight: 1.3, marginBottom: 4 },
  h3: { fontSize: 14, lineHeight: 1.35, marginBottom: 3 },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  listItem: { fontSize: 12, lineHeight: 1.5, marginBottom: 2 },
  quote: { fontSize: 12, lineHeight: 1.5, marginLeft: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#d9cfb0' },
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyDocument = Document as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPage = Page as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyView = View as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyText = Text as any

function renderInline(text: string, keyPrefix: string) {
  const segments: Array<{ text: string; bold?: boolean; italic?: boolean }> = []
  const pattern = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|\[([^\]]+)\]\([^)]+\))/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index) })
    segments.push({
      text: match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[0],
      bold: Boolean(match[2] || match[3]),
      italic: Boolean(match[4] || match[5]),
    })
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) })

  return segments.map((segment, index) => createElement(
    AnyText,
    {
      key: `${keyPrefix}-${index}`,
      style: [segment.bold ? styles.bold : null, segment.italic ? styles.italic : null].filter(Boolean),
    },
    segment.text,
  ))
}

function renderMarkdownBlocks(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const elements = []
  let paragraph: string[] = []
  let listItems: Array<{ text: string; marker: string }> = []

  function flushParagraph() {
    if (!paragraph.length) return
    const index = elements.length
    elements.push(createElement(
      AnyText,
      { key: `p-${index}`, style: styles.paragraph },
      ...renderInline(paragraph.join('\n'), `p-${index}`),
    ))
    paragraph = []
  }

  function flushList() {
    if (!listItems.length) return
    for (const item of listItems) {
      const index: number = elements.length
      elements.push(createElement(
        AnyText,
        { key: `li-${index}`, style: styles.listItem },
        `${item.marker} `,
        ...renderInline(item.text, `li-${index}`),
      ))
    }
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
      const index: number = elements.length
      const level = heading[1].length
      elements.push(createElement(
        AnyText,
        { key: `h-${index}`, style: level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3 },
        ...renderInline(heading[2], `h-${index}`),
      ))
      continue
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/)
    const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/)
    if (unordered || ordered) {
      flushParagraph()
      listItems.push({
        marker: ordered ? `${ordered[1]}.` : '•',
        text: ordered?.[2] ?? unordered?.[1] ?? '',
      })
      continue
    }

    const quote = line.match(/^>\s?(.+)$/)
    if (quote) {
      flushParagraph()
      flushList()
      const index: number = elements.length
      elements.push(createElement(
        AnyText,
        { key: `q-${index}`, style: styles.quote },
        ...renderInline(quote[1], `q-${index}`),
      ))
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  return elements
}

function buildLetterDocument(pages: { name: string; subject?: string; body: string }[]) {
  return createElement(
    AnyDocument,
    null,
    ...pages.map((page, i) =>
      createElement(
        AnyPage,
        { key: i, size: 'A4', style: styles.page },
        createElement(
          AnyView,
          { style: styles.body },
          ...(page.subject
            ? [createElement(AnyText, { key: 'subject', style: styles.h1 }, page.subject)]
            : []),
          ...renderMarkdownBlocks(page.body),
        ),
      ),
    ),
  )
}

export async function generateLetterPdf(
  contacts: { first_name: string; last_name: string }[],
  body: string,
  subjectTemplate?: string,
): Promise<Buffer> {
  const pages = contacts.map((contact) => {
    const vars = { first_name: contact.first_name, last_name: contact.last_name }
    return {
      name: `${contact.first_name} ${contact.last_name}`,
      subject: subjectTemplate ? interpolate(subjectTemplate, vars) : undefined,
      body: interpolate(body, vars),
    }
  })

  const doc = buildLetterDocument(pages)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any)
}
