import { describe, it, expect } from 'vitest'
import { contactSchema, letterDraftSchema } from './schemas'

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
