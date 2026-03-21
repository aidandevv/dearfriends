import { describe, it, expect } from 'vitest'
import { contactSchema, letterDraftSchema, slugSchema, letterStyleSchema } from './schemas'

describe('contactSchema', () => {
  const valid = {
    first_name: 'Ada', last_name: 'L', email: 'a@b.com',
    address_line_1: '1 Main', city: 'NY', state: 'NY', zip: '10001',
    delivery_method: 'print',
  }

  it('accepts valid contact', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })

  it('rejects invalid delivery_method', () => {
    expect(contactSchema.safeParse({ ...valid, delivery_method: 'fax' }).success).toBe(false)
  })
})

describe('letterDraftSchema', () => {
  it('accepts valid draft', () => {
    expect(letterDraftSchema.safeParse({ subject: 'Hello', body: '# Hi' }).success).toBe(true)
  })

  it('rejects empty subject', () => {
    expect(letterDraftSchema.safeParse({ subject: '', body: 'hi' }).success).toBe(false)
  })
})

describe('slugSchema', () => {
  it('accepts valid slug', () => {
    expect(slugSchema.safeParse('hello-world').success).toBe(true)
  })
  it('accepts underscores', () => {
    expect(slugSchema.safeParse('my_slug').success).toBe(true)
  })
  it('accepts digits', () => {
    expect(slugSchema.safeParse('abc123').success).toBe(true)
  })
  it('rejects uppercase (lowercasing is caller responsibility)', () => {
    expect(slugSchema.safeParse('Hello').success).toBe(false)
  })
  it('rejects too short', () => {
    expect(slugSchema.safeParse('ab').success).toBe(false)
  })
  it('rejects too long', () => {
    expect(slugSchema.safeParse('a'.repeat(31)).success).toBe(false)
  })
  it('rejects reserved slug: login', () => {
    expect(slugSchema.safeParse('login').success).toBe(false)
  })
  it('rejects reserved slug: dashboard', () => {
    expect(slugSchema.safeParse('dashboard').success).toBe(false)
  })
  it('rejects reserved slug: api', () => {
    expect(slugSchema.safeParse('api').success).toBe(false)
  })
  it('rejects spaces', () => {
    expect(slugSchema.safeParse('hello world').success).toBe(false)
  })
})

describe('letterStyleSchema', () => {
  const valid = {
    font: 'serif',
    accentColor: '#C05C2E',
    lineSpacing: 'normal',
    fontSize: 'medium',
  }

  it('accepts valid style', () => {
    expect(letterStyleSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts sans font', () => {
    expect(letterStyleSchema.safeParse({ ...valid, font: 'sans' }).success).toBe(true)
  })

  it('rejects unknown font', () => {
    expect(letterStyleSchema.safeParse({ ...valid, font: 'mono' }).success).toBe(false)
  })

  it('rejects malformed hex color (no #)', () => {
    expect(letterStyleSchema.safeParse({ ...valid, accentColor: 'C05C2E' }).success).toBe(false)
  })

  it('rejects 3-char hex', () => {
    expect(letterStyleSchema.safeParse({ ...valid, accentColor: '#C05' }).success).toBe(false)
  })

  it('rejects invalid lineSpacing', () => {
    expect(letterStyleSchema.safeParse({ ...valid, lineSpacing: 'wide' }).success).toBe(false)
  })

  it('rejects invalid fontSize', () => {
    expect(letterStyleSchema.safeParse({ ...valid, fontSize: 'huge' }).success).toBe(false)
  })
})
