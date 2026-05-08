'use server'

import { revalidatePath } from 'next/cache'
import { onboardingSchema, profileSchema, slugSchema } from '@/lib/schemas'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function completeOnboarding(input: unknown) {
  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) return { error: 'Please enter your name.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      full_name: parsed.data.full_name.trim(),
      has_seen_tour: false,
    },
  })

  if (error) return { error: error.message }

  // Fire-and-forget slug generation — don't block onboarding on failure
  try {
    await generateShareSlug(user.id)
  } catch {
    // Non-fatal: slug will be generated lazily on first dashboard visit
  }

  revalidatePath('/dashboard')
  revalidatePath('/onboarding')
  return { success: true }
}

export async function markTourSeen() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.auth.updateUser({
    data: {
      ...(user.user_metadata ?? {}),
      has_seen_tour: true,
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function recordFirstSent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Only set if not already set
  if (user.user_metadata?.first_sent_at) return

  await supabase.auth.updateUser({
    data: { first_sent_at: new Date().toISOString() }
  })
}

export async function updateProfile(data: unknown) {
  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid profile data.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.auth.updateUser({ data: parsed.data })
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export type ShareSlugResolution = {
  adminId: string
  groupId: string | null
}

// Scans all auth users and group share links for a matching slug.
export async function resolveShareSlug(slug: string): Promise<ShareSlugResolution | null> {
  const admin = createAdminClient()
  const normalised = slug.toLowerCase()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error || !data) break
    const match = data.users.find(
      u => u.user_metadata?.share_slug === normalised
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

// Scans all auth users for a matching share_slug. Returns adminId or null.
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
      u => u.id !== opts.excludingUserId && u.user_metadata?.share_slug === normalised
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

// Generates and saves an 8-char share slug for the given user.
// Pass userId when the caller already has it; omit to resolve from session.
export async function generateShareSlug(userId?: string): Promise<string> {
  const admin = createAdminClient()

  const resolvedId = userId ?? (await (await createClient()).auth.getUser()).data.user?.id
  if (!resolvedId) throw new Error('Not authenticated')

  const existingSlugCount = await countShareSlugsForAdmin(resolvedId)
  if (existingSlugCount >= 10) throw new Error('Users can have up to 10 share slugs')

  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = randomSlug()
    const taken = await isShareSlugTaken(slug)
    if (taken) continue  // collision — try again

    const { data: userData } = await admin.auth.admin.getUserById(resolvedId)
    const existingMeta = userData.user?.user_metadata ?? {}
    const { error } = await admin.auth.admin.updateUserById(resolvedId, {
      user_metadata: { ...existingMeta, share_slug: slug },
    })
    if (error) throw new Error(error.message)
    return slug
  }
  throw new Error('Could not generate a unique share slug after 3 attempts')
}

export async function updateShareSlug(slug: string): Promise<{ error?: string }> {
  const normalised = slug.toLowerCase()
  const parsed = slugSchema.safeParse(normalised)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid slug' }

  const anon = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await anon.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: userData } = await admin.auth.admin.getUserById(user.id)
  const existingMeta = userData.user?.user_metadata ?? {}
  const currentlyHasSlug = typeof existingMeta.share_slug === 'string'
    && existingMeta.share_slug.trim().length > 0
  if (!currentlyHasSlug) {
    const slugCount = await countShareSlugsForAdmin(user.id)
    if (slugCount >= 10) return { error: 'slug_limit' }
  }

  const conflict = await isShareSlugTaken(normalised, { excludingUserId: user.id })
  if (conflict) return { error: 'slug_taken' }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...existingMeta, share_slug: normalised },
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return {}
}
