import { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { interpolate } from './utils'

const styles = StyleSheet.create({
  page: { padding: 60, fontFamily: 'Helvetica', fontSize: 12, lineHeight: 1.6 },
  body: { whiteSpace: 'pre-wrap' as const },
})

function buildLetterDocument(pages: { name: string; body: string }[]) {
  return createElement(
    Document,
    null,
    ...pages.map((page, i) =>
      createElement(
        Page,
        { key: i, size: 'A4', style: styles.page },
        createElement(View, { style: styles.body }, createElement(Text, null, page.body)),
      ),
    ),
  )
}

export async function generateLetterPdf(
  contacts: { first_name: string; last_name: string }[],
  body: string,
): Promise<Buffer> {
  const pages = contacts.map((contact) => ({
    name: `${contact.first_name} ${contact.last_name}`,
    body: interpolate(body, { first_name: contact.first_name, last_name: contact.last_name }),
  }))

  const doc = buildLetterDocument(pages)
  return renderToBuffer(doc)
}
