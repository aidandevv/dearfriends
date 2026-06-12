import { lookup } from 'dns/promises'
import { isIP } from 'net'

const MAX_CALENDAR_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 8000

function isPrivateIPv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return true
  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 0) ||
    a >= 224
  )
}

function isPrivateIPv6(address: string) {
  const normal = address.toLowerCase()
  // IPv4-mapped/compatible forms (::ffff:10.0.0.1, ::10.0.0.1) embed an IPv4
  // address that must pass the IPv4 checks, not the IPv6 prefix checks.
  const embeddedIPv4 = normal.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/)
  if (embeddedIPv4) {
    return isIP(embeddedIPv4[1]) !== 4 || isPrivateIPv4(embeddedIPv4[1])
  }
  return (
    normal === '::1' ||
    normal === '::' ||
    normal.startsWith('::') ||
    normal.startsWith('fc') ||
    normal.startsWith('fd') ||
    normal.startsWith('fe80:') ||
    normal.startsWith('ff')
  )
}

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host === 'localhost' || host.endsWith('.localhost')
}

function isBlockedAddress(address: string) {
  const family = isIP(address)
  if (family === 4) return isPrivateIPv4(address)
  if (family === 6) return isPrivateIPv6(address)
  return true
}

export async function validateCalendarSubscriptionUrl(rawUrl: string): Promise<string | null> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return 'Paste a valid calendar subscription URL.'
  }

  if (url.protocol !== 'https:') return 'Calendar subscriptions must use HTTPS.'
  if (url.username || url.password) return 'Calendar URLs cannot include credentials.'
  if (isBlockedHost(url.hostname)) return 'Calendar URL host is not allowed.'

  // IPv6 literals arrive bracketed ([::1]) from url.hostname; strip before isIP.
  const hostLiteral = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(hostLiteral)) {
    return isBlockedAddress(hostLiteral) ? 'Calendar URL host is not allowed.' : null
  }

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true })
    if (!addresses.length || addresses.some(({ address }) => isBlockedAddress(address))) {
      return 'Calendar URL host is not allowed.'
    }
  } catch {
    return 'Could not resolve that calendar URL.'
  }

  return null
}

async function fetchWithTimeout(url: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchCalendarSubscription(rawUrl: string): Promise<{ text?: string; error?: string }> {
  let currentUrl = rawUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const validationError = await validateCalendarSubscriptionUrl(currentUrl)
    if (validationError) return { error: validationError }

    let response: Response
    try {
      response = await fetchWithTimeout(currentUrl)
    } catch {
      return { error: 'Could not read that calendar URL.' }
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) return { error: 'Calendar URL redirected without a location.' }
      currentUrl = new URL(location, currentUrl).toString()
      continue
    }

    if (!response.ok) return { error: 'Could not read that calendar URL.' }

    const contentLength = Number(response.headers.get('content-length') ?? 0)
    if (contentLength > MAX_CALENDAR_BYTES) return { error: 'Calendar file is too large.' }

    const text = await response.text()
    if (Buffer.byteLength(text, 'utf8') > MAX_CALENDAR_BYTES) {
      return { error: 'Calendar file is too large.' }
    }

    return { text }
  }

  return { error: 'Calendar URL redirected too many times.' }
}
