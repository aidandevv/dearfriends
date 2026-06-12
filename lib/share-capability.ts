import { createHmac, timingSafeEqual } from 'crypto'

const SHARE_CAPABILITY_TTL_MS = 24 * 60 * 60 * 1000

type ShareCapabilityPayload = {
  adminId: string
  groupId: string | null
  exp: number
}

export type ShareCapability = {
  adminId: string
  groupId: string | null
}

function signingSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  return secret
}

function encode(value: string) {
  return Buffer.from(value).toString('base64url')
}

function decode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(payload: string) {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url')
}

function equalSignature(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createShareCapability(input: ShareCapability, now = Date.now()) {
  const payload: ShareCapabilityPayload = {
    adminId: input.adminId,
    groupId: input.groupId,
    exp: now + SHARE_CAPABILITY_TTL_MS,
  }
  const encoded = encode(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function verifyShareCapability(token: string, now = Date.now()): ShareCapability | null {
  const [encoded, signature] = token.split('.')
  if (!encoded || !signature) return null
  if (!equalSignature(signature, sign(encoded))) return null

  try {
    const payload = JSON.parse(decode(encoded)) as Partial<ShareCapabilityPayload>
    if (typeof payload.adminId !== 'string') return null
    if (payload.groupId !== null && typeof payload.groupId !== 'string') return null
    if (typeof payload.exp !== 'number' || payload.exp <= now) return null
    return { adminId: payload.adminId, groupId: payload.groupId ?? null }
  } catch {
    return null
  }
}
