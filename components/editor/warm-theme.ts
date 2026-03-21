import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

const warmEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#F5EFE4',
      color: '#231209',
      fontFamily: '"DM Sans", sans-serif',
      fontSize: '14px',
    },
    '.cm-content': {
      padding: '16px 20px',
      caretColor: '#C05C2E',
      lineHeight: '1.75',
      minHeight: '380px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#C05C2E',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-scroller': {
      fontFamily: 'inherit',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(192,92,46,0.15)',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'rgba(192,92,46,0.2)',
    },
  },
  { dark: false },
)

const warmHighlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: '1.35em',
    fontWeight: '700',
    color: '#231209',
    fontFamily: '"Playfair Display", serif',
    lineHeight: '1.3',
  },
  {
    tag: tags.heading2,
    fontSize: '1.15em',
    fontWeight: '700',
    color: '#231209',
    fontFamily: '"Playfair Display", serif',
  },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#3d2212' },
  { tag: tags.url, color: '#C05C2E', textDecoration: 'underline' },
  { tag: tags.monospace, fontFamily: 'monospace', color: '#5A7A5A', fontSize: '0.9em' },
  { tag: tags.processingInstruction, color: '#9E4A23', fontFamily: 'monospace', fontSize: '0.85em' },
])

export const warmExtensions = [warmEditorTheme, syntaxHighlighting(warmHighlightStyle)]
