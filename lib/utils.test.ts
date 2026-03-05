import { describe, it, expect } from 'vitest'
import { interpolate, formatCsvRow, toCsv } from './utils'

describe('interpolate', () => {
  it('replaces known variables', () => {
    expect(interpolate('Dear {{first_name}} {{last_name}},', { first_name: 'Ada', last_name: 'Lovelace' }))
      .toBe('Dear Ada Lovelace,')
  })

  it('leaves unknown variables intact', () => {
    expect(interpolate('Hello {{unknown}}', { first_name: 'Ada', last_name: 'B' }))
      .toBe('Hello {{unknown}}')
  })

  it('handles empty body', () => {
    expect(interpolate('', { first_name: 'A', last_name: 'B' })).toBe('')
  })
})

describe('toCsv', () => {
  it('produces header + data rows', () => {
    const rows = [{ first_name: 'Ada', last_name: 'L', address_line_1: '1 Main St', address_line_2: '', city: 'NY', state: 'NY', zip: '10001' }]
    const csv = toCsv(rows)
    expect(csv).toContain('First Name')
    expect(csv).toContain('Ada')
    expect(csv).toContain('1 Main St')
  })

  it('escapes commas in fields', () => {
    const rows = [{ first_name: 'A,B', last_name: 'L', address_line_1: '1 Main', address_line_2: '', city: 'NY', state: 'NY', zip: '10001' }]
    expect(toCsv(rows)).toContain('"A,B"')
  })
})
