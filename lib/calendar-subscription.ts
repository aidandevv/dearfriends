import { lookup } from 'dns/promises'
import { request } from 'node:https'
import { isIP } from 'net'

const MAX_CALENDAR_BYTES = 1024 * 1024
const MAX_REDIRECTS = 3
const FETCH_TIMEOUT_MS = 8000

type ValidatedAddress = {
  address: string
  family: 4 | 6
}

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

async function resolveValidatedCalendarUrl(rawUrl: string): Promise<{ url: URL; address: ValidatedAddress } | { error: string }> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { error: 'Paste a valid calendar subscription URL.' }
  }

  if (url.protocol !== 'https:') return { error: 'Calendar subscriptions must use HTTPS.' }
  if (url.username || url.password) return { error: 'Calendar URLs cannot include credentials.' }
  if (isBlockedHost(url.hostname)) return { error: 'Calendar URL host is not allowed.' }

  // IPv6 literals arrive bracketed ([::1]) from url.hostname; strip before isIP.
  const hostLiteral = url.hostname.replace(/^\[|\]$/g, '')
  if (isIP(hostLiteral)) {
    if (isBlockedAddress(hostLiteral)) return { error: 'Calendar URL host is not allowed.' }
    return { url, address: { address: hostLiteral, family: isIP(hostLiteral) as 4 | 6 } }
  }

  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true })
    if (!addresses.length) return { error: 'Calendar URL host is not allowed.' }
    const safeAddresses = addresses.filter(({ address }) => !isBlockedAddress(address))
    if (safeAddresses.length !== addresses.length) {
      return { error: 'Calendar URL host is not allowed.' }
    }
    const selected = safeAddresses[0]
    return {
      url,
      address: {
        address: selected.address,
        family: selected.family as 4 | 6,
      },
    }
  } catch {
    return { error: 'Could not resolve that calendar URL.' }
  }
}

export async function validateCalendarSubscriptionUrl(rawUrl: string): Promise<string | null> {
  const result = await resolveValidatedCalendarUrl(rawUrl)
  return 'error' in result ? result.error : null
}

function fetchPinnedUrl(url: URL, pinned: ValidatedAddress): Promise<{
  ok: boolean
  status: number
  headers: Map<string, string>
  text(): Promise<string>
}> {
  return new Promise((resolve, reject) => {
    const req = request(url, {
      lookup: (_hostname, _options, callback) => {
        callback(null, pinned.address, pinned.family)
      },
      servername: url.hostname,
      timeout: FETCH_TIMEOUT_MS,
    }, response => {
      const chunks: Buffer[] = []
      let bytes = 0

      response.on('data', chunk => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        bytes += buffer.length
        if (bytes > MAX_CALENDAR_BYTES) {
          req.destroy()
          reject(new Error('too-large'))
          return
        }
        chunks.push(buffer)
      })

      response.on('end', () => {
        const headers = new Map<string, string>()
        for (const [key, value] of Object.entries(response.headers)) {
          if (Array.isArray(value)) headers.set(key.toLowerCase(), value.join(', '))
          else if (typeof value === 'string') headers.set(key.toLowerCase(), value)
        }
        const status = response.statusCode ?? 0
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers,
          async text() { return body },
        })
      })
    })

    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    req.end()
  })
}

export async function fetchCalendarSubscription(rawUrl: string): Promise<{ text?: string; error?: string }> {
  let currentUrl = rawUrl

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const validated = await resolveValidatedCalendarUrl(currentUrl)
    if ('error' in validated) return { error: validated.error }

    let response: Awaited<ReturnType<typeof fetchPinnedUrl>>
    try {
      response = await fetchPinnedUrl(validated.url, validated.address)
    } catch (error) {
      if (error instanceof Error && error.message === 'too-large') return { error: 'Calendar file is too large.' }
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
