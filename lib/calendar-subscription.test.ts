import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { lookup } from 'dns/promises'
import { request } from 'node:https'
import { fetchCalendarSubscription, validateCalendarSubscriptionUrl } from './calendar-subscription'

const lookupMock = vi.hoisted(() => vi.fn())
const requestMock = vi.hoisted(() => vi.fn())

vi.mock('dns/promises', () => ({
  lookup: lookupMock,
  default: { lookup: lookupMock },
}))

vi.mock('node:https', () => ({
  request: requestMock,
  default: { request: requestMock },
}))

function mockHttpsResponse(body: string | null, init: { status?: number; headers?: Record<string, string> } = {}) {
  vi.mocked(request).mockImplementationOnce(((_url: URL, _options: object, callback: (response: Readable & { statusCode?: number; headers: Record<string, string> }) => void) => {
    const req = new EventEmitter() as EventEmitter & {
      end: () => void
      destroy: (error?: Error) => void
      setTimeout: () => void
    }
    req.setTimeout = vi.fn()
    req.destroy = vi.fn((error?: Error) => {
      if (error) req.emit('error', error)
    })
    req.end = vi.fn(() => {
      const response = new Readable({
        read() {
          if (body !== null) this.push(body)
          this.push(null)
        },
      }) as Readable & { statusCode?: number; headers: Record<string, string> }
      response.statusCode = init.status ?? 200
      response.headers = init.headers ?? {}
      callback(response)
    })
    return req
  }) as never)
}

describe('calendar subscription URL validation', () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset()
    vi.mocked(request).mockReset()
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
    mockHttpsResponse('BEGIN:VEVENT\nSUMMARY:Birthday\nDTSTART:20260101\nEND:VEVENT', {
      headers: { 'content-length': '58' },
    })

    await expect(fetchCalendarSubscription('https://calendar.example.com/feed.ics')).resolves.toMatchObject({
      text: expect.stringContaining('BEGIN:VEVENT'),
    })

    const [, options] = vi.mocked(request).mock.calls[0]
    expect((options as { lookup: unknown }).lookup).toEqual(expect.any(Function))
  })

  it('rejects redirects to blocked destinations', async () => {
    vi.mocked(lookup).mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as never)
    mockHttpsResponse(null, {
      status: 302,
      headers: { location: 'https://127.0.0.1/feed.ics' },
    })

    await expect(fetchCalendarSubscription('https://calendar.example.com/feed.ics')).resolves.toMatchObject({
      error: 'Calendar URL host is not allowed.',
    })
  })

  it('pins the HTTPS request to the address that passed validation', async () => {
    vi.mocked(lookup).mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as never)
    mockHttpsResponse('BEGIN:VEVENT\nSUMMARY:Birthday\nDTSTART:20260101\nEND:VEVENT')

    await fetchCalendarSubscription('https://calendar.example.com/feed.ics')

    const [, options] = vi.mocked(request).mock.calls[0]
    const lookupOption = (options as { lookup: (hostname: string, opts: object, cb: (error: Error | null, address: string, family: number) => void) => void }).lookup
    const callback = vi.fn()
    lookupOption('calendar.example.com', {}, callback)
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4)
  })
})
