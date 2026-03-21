import { describe, it, expect } from 'vitest'
import {
  DEFAULT_STYLE,
  normalizeTemplate,
  LETTER_TEMPLATES,
  type LetterStyle,
  type ComposerTemplate,
} from './letter-templates'

describe('DEFAULT_STYLE', () => {
  it('has all required fields', () => {
    expect(DEFAULT_STYLE).toMatchObject({
      font: 'serif',
      accentColor: '#C05C2E',
      lineSpacing: 'normal',
      fontSize: 'medium',
    })
  })
})

describe('normalizeTemplate', () => {
  it('maps defaultBody → body', () => {
    const t = normalizeTemplate(LETTER_TEMPLATES[0])
    expect(t.body).toBe(LETTER_TEMPLATES[0].defaultBody)
  })

  it('sets source to builtin', () => {
    expect(normalizeTemplate(LETTER_TEMPLATES[0]).source).toBe('builtin')
  })

  it('uses DEFAULT_STYLE when template has no style', () => {
    const t = normalizeTemplate({ id: 'x', name: 'X', defaultBody: 'hi' })
    expect(t.style).toEqual(DEFAULT_STYLE)
  })

  it('uses template style when present', () => {
    const style: LetterStyle = { font: 'sans', accentColor: '#9B59B6', lineSpacing: 'relaxed', fontSize: 'large' }
    const t = normalizeTemplate({ id: 'x', name: 'X', defaultBody: 'hi', style })
    expect(t.style).toEqual(style)
  })

  it('produces a valid ComposerTemplate', () => {
    const t = normalizeTemplate(LETTER_TEMPLATES[0])
    const keys: (keyof ComposerTemplate)[] = ['id', 'name', 'body', 'style', 'source']
    keys.forEach(k => expect(t).toHaveProperty(k))
  })
})
