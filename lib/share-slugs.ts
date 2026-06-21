import { createAdminClient } from '@/lib/supabase/server'

export type ShareSlugResolution = {
  adminId: string
  groupId: string | null
}

export async function resolveShareSlug(slug: string): Promise<ShareSlugResolution | null> {
  const admin = createAdminClient()
  const normalised = slug.toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    const match = data.users.find(
      user => user.user_metadata?.share_slug === normalised
    )
    if (match) return { adminId: match.id, groupId: null }
    if (data.users.length < perPage) break
    page++
  }

  const { data: group } = await admin
    .from('groups')
    .select('id, admin_id')
    .eq('share_slug', normalised)
    .maybeSingle()

  if (group) return { adminId: group.admin_id, groupId: group.id }

  return null
}

export async function resolveSlugToAdminId(slug: string): Promise<string | null> {
  const resolution = await resolveShareSlug(slug)
  return resolution?.adminId ?? null
}

export async function isShareSlugTaken(
  slug: string,
  opts: { excludingUserId?: string; excludingGroupId?: string } = {},
): Promise<boolean> {
  const admin = createAdminClient()
  const normalised = slug.toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    const conflict = data.users.find(
      user => user.id !== opts.excludingUserId && user.user_metadata?.share_slug === normalised
    )
    if (conflict) return true
    if (data.users.length < perPage) break
    page++
  }

  const { data } = await admin
    .from('groups')
    .select('id')
    .eq('share_slug', normalised)

  return (data ?? []).some(group => group.id !== opts.excludingGroupId)
}

export async function countShareSlugsForAdmin(adminId: string): Promise<number> {
  const admin = createAdminClient()
  const { data: userData } = await admin.auth.admin.getUserById(adminId)
  const hasPrimarySlug = typeof userData.user?.user_metadata?.share_slug === 'string'
    && userData.user.user_metadata.share_slug.trim().length > 0

  const { count } = await admin
    .from('groups')
    .select('id', { count: 'exact', head: true })
    .eq('admin_id', adminId)
    .not('share_slug', 'is', null)

  return (hasPrimarySlug ? 1 : 0) + (count ?? 0)
}

function randomSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function generateShareSlugForUser(userId: string): Promise<string> {
  const admin = createAdminClient()

  const existingSlugCount = await countShareSlugsForAdmin(userId)
  if (existingSlugCount >= 10) throw new Error('Users can have up to 10 share slugs')

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = randomSlug()
    const taken = await isShareSlugTaken(slug)
    if (taken) continue

    const { data: userData } = await admin.auth.admin.getUserById(userId)
    const existingMeta = userData.user?.user_metadata ?? {}
    const { error } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existingMeta, share_slug: slug },
    })
    if (error) throw new Error(error.message)
    return slug
  }

  throw new Error('Could not generate a unique share slug after 3 attempts')
}
