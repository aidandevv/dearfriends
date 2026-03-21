import { createElement } from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'
import { interpolate } from './utils'
import { DEFAULT_STYLE, type LetterStyle } from './letter-templates'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyDocument = Document as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyPage = Page as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyView = View as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyText = Text as any

const FONT_MAP = {
  serif: 'Times-Roman',
  sans: 'Helvetica',
} as const

const FONT_SIZE_MAP = {
  small: 10,
  medium: 12,
  large: 14,
} as const

const LINE_HEIGHT_MAP = {
  compact: 1.4,
  normal: 1.6,
  relaxed: 1.9,
} as const

function buildLetterDocument(
  pages: { name: string; body: string }[],
  style: LetterStyle,
) {
  const pageStyles = StyleSheet.create({
    page: {
      padding: 60,
      fontFamily: FONT_MAP[style.font],
      fontSize: FONT_SIZE_MAP[style.fontSize],
      lineHeight: LINE_HEIGHT_MAP[style.lineSpacing],
    },
    body: { whiteSpace: 'pre-wrap' as const },
  })

  return createElement(
    AnyDocument,
    null,
    ...pages.map((page, i) =>
      createElement(
        AnyPage,
        { key: i, size: 'A4', style: pageStyles.page },
        createElement(AnyView, { style: pageStyles.body }, createElement(AnyText, null, page.body)),
      ),
    ),
  )
}

export async function generateLetterPdf(
  contacts: { first_name: string; last_name: string }[],
  body: string,
  style: LetterStyle = DEFAULT_STYLE,
): Promise<Buffer> {
  const pages = contacts.map(contact => ({
    name: `${contact.first_name} ${contact.last_name}`,
    body: interpolate(body, { first_name: contact.first_name, last_name: contact.last_name }),
  }))

  const doc = buildLetterDocument(pages, style)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(doc as any)
}
