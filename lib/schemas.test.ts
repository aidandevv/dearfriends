import { describe, it, expect } from 'vitest'
import { contactSchema, contactEditSchema, letterDraftSchema, mailingOriginSchema, slugSchema, type ContactInput } from './schemas'

describe('contactEditSchema', () => {
  const valid = {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
    address_line_1: '1 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    is_international: false,
    tags: 'family, college',
  }

  it('accepts a full admin edit payload', () => {
    expect(contactEditSchema.safeParse(valid).success).toBe(true)
  })

  it('uppercases and validates domestic states', () => {
    const parsed = contactEditSchema.safeParse({ ...valid, state: ' tx ' })
    expect(parsed.success && parsed.data.state).toBe('TX')
    expect(contactEditSchema.safeParse({ ...valid, state: 'ZZ' }).success).toBe(false)
  })

  it('requires country for international addresses', () => {
    expect(contactEditSchema.safeParse({ ...valid, is_international: true }).success).toBe(false)
  })

  it('allows freeform regions for international addresses', () => {
    expect(contactEditSchema.safeParse({
      ...valid,
      state: 'Ontario',
      is_international: true,
      country: 'Canada',
    }).success).toBe(true)
  })
})

describe('contactSchema', () => {
  const valid = {
    first_name: 'Ada', last_name: 'L', email: 'a@b.com',
    address_line_1: '1 Main', city: 'NY', state: 'NY', zip: '10001',
    delivery_method: 'print',
  } satisfies ContactInput

  it('accepts valid contact', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts form values before schema defaults are applied', () => {
    const formValues: ContactInput = valid
    expect(contactSchema.parse(formValues)).toMatchObject({
      is_international: false,
      tags: [],
    })
  })

  it('rejects invalid domestic states', () => {
    expect(contactSchema.safeParse({ ...valid, state: 'California' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(contactSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })

  it('accepts handwrite delivery_method', () => {
    expect(contactSchema.safeParse({ ...valid, delivery_method: 'handwrite' }).success).toBe(true)
  })

  it('rejects invalid delivery_method', () => {
    expect(contactSchema.safeParse({ ...valid, delivery_method: 'fax' }).success).toBe(false)
  })
})

describe('mailingOriginSchema', () => {
  it('normalizes valid state codes', () => {
    const parsed = mailingOriginSchema.safeParse({ mailing_state: ' ca ' })
    expect(parsed.success && parsed.data.mailing_state).toBe('CA')
  })

  it('rejects invalid state codes', () => {
    expect(mailingOriginSchema.safeParse({ mailing_state: 'ZZ' }).success).toBe(false)
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
