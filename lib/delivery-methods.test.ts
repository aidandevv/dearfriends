import { describe, it, expect } from 'vitest'
import {
  DELIVERY_LABELS,
  isDeliveryMethod,
  isPhysicalMailMethod,
  usesAveryLabels,
} from './delivery-methods'

describe('delivery-methods', () => {
  it('labels handwrite clearly as DIY', () => {
    expect(DELIVERY_LABELS.handwrite).toBe('Write by hand')
  })

  it('recognizes valid delivery methods', () => {
    expect(isDeliveryMethod('handwrite')).toBe(true)
    expect(isDeliveryMethod('fax')).toBe(false)
  })

  it('treats handwrite and print as physical mail', () => {
    expect(isPhysicalMailMethod('handwrite')).toBe(true)
    expect(isPhysicalMailMethod('print')).toBe(true)
    expect(isPhysicalMailMethod('digital')).toBe(false)
  })

  it('uses Avery format for handwrite and print CSV exports', () => {
    expect(usesAveryLabels('handwrite')).toBe(true)
    expect(usesAveryLabels('print')).toBe(true)
    expect(usesAveryLabels('digital')).toBe(false)
    expect(usesAveryLabels('all')).toBe(false)
  })
})
