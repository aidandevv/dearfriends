import { describe, expect, it } from 'vitest'
import { toAveryCsv, toCsv } from './utils'

describe('toAveryCsv', () => {
  it('uses Avery 5160-style columns with a combined name field', () => {
    const csv = toAveryCsv([{
      first_name: 'Ada',
      last_name: 'Lovelace',
      address_line_1: '1 Main St',
      address_line_2: 'Apt 2',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    }])

    expect(csv).toContain('Name,Address Line 1,Address Line 2,City,State,ZIP Code')
    expect(csv).toContain('Ada Lovelace')
    expect(csv).toContain('1 Main St')
    expect(csv).toContain('78701')
  })
})

describe('toCsv', () => {
  it('still supports the generic export layout', () => {
    const csv = toCsv([{
      first_name: 'Ada',
      last_name: 'L',
      address_line_1: '1 Main St',
      address_line_2: '',
      city: 'NY',
      state: 'NY',
      zip: '10001',
    }])
    expect(csv).toContain('First Name')
    expect(csv).toContain('Ada')
  })
})
