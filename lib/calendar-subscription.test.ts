import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lookup } from 'dns/promises'
import { fetchCalendarSubscription, validateCalendarSubscriptionUrl } from './calendar-subscription'

const lookupMock = vi.hoisted(() => vi.fn())

vi.mock('dns/promises', () => ({
  lookup: lookupMock,
  default: { lookup: lookupMock },
}))

describe('calendar subscription URL validation', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects non-HTTPS URLs', async () => {
    expect(await validateCalendarSubscriptionUrl('http://example.com/calendar.ics')).toBe('Calendar subscriptions must use HTTPS.')
  })

  it('rejects localhost and private IP destinations', async () => {
    expect(await validateCalendarSubscriptionUrl('https://localhost/calendar.ics')).toBe('Calendar URL host is not allowed.')
    expect(await validateCalendarSubscriptionUrl('https://192.168.1.10/calendar.ics')).toBe('Calendar URL host is not allowed.')
  })

  it('rejects IPv4-mapped IPv6 forms of private addresses', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '::ffff:10.0.0.2', family: 6 }] as never)
    expect(await validateCalendarSubscriptionUrl('https://calendar.example.com/feed.ics')).toBe('Calendar URL host is not allowed.')
    expect(await validateCalendarSubscriptionUrl('https://[::ffff:192.168.1.10]/feed.ics')).toBe('Calendar URL host is not allowed.')
    expect(await validateCalendarSubscriptionUrl('https://[::127.0.0.1]/feed.ics')).toBe('Calendar URL host is not allowed.')
    expect(await validateCalendarSubscriptionUrl('https://[::ffff:7f00:1]/feed.ics')).toBe('Calendar URL host is not allowed.')
  })

  it('rejects DNS results that resolve to private addresses', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '10.0.0.2', family: 4 }] as never)
    expect(await validateCalendarSubscriptionUrl('https://calendar.example.com/feed.ics')).toBe('Calendar URL host is not allowed.')
  })

  it('allows a normal HTTPS ICS response', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never)
    vi.mocked(fetch).mockResolvedValueOnce(new Response('BEGIN:VEVENT\nSUMMARY:Birthday\nDTSTART:20260101\nEND:VEVENT', {
      headers: { 'content-length': '58' },
    }))

    await expect(fetchCalendarSubscription('https://calendar.example.com/feed.ics')).resolves.toMatchObject({
      text: expect.stringContaining('BEGIN:VEVENT'),
    })
  })

  it('rejects redirects to blocked destinations', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as never)
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: 'https://127.0.0.1/feed.ics' },
    }))

    await expect(fetchCalendarSubscription('https://calendar.example.com/feed.ics')).resolves.toMatchObject({
      error: 'Calendar URL host is not allowed.',
    })
  })
})
