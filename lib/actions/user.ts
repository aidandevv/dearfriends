'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { onboardingSchema, profileSchema, slugSchema } from '@/lib/schemas'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  countShareSlugsForAdmin,
  generateShareSlugForUser,
  isShareSlugTaken,
} from '@/lib/share-slugs'

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
    await generateShareSlugForUser(user.id)
  } catch {
    // Non-fatal: slug will be generated lazily on first dashboard visit
  }

  revalidatePath('/dashboard')
  revalidatePath('/onboarding')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
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

export async function generateShareSlug(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  return generateShareSlugForUser(user.id)
}

export async function updateShareMessage(message: string): Promise<{ error?: string }> {
  const trimmed = message.trim()
  if (!trimmed) return { error: 'Message cannot be empty.' }
  if (trimmed.length > 200) return { error: 'Message must be 200 characters or fewer.' }

  const anon = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await anon.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: userData } = await admin.auth.admin.getUserById(user.id)
  const existingMeta = userData.user?.user_metadata ?? {}
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...existingMeta, share_message: trimmed },
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
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
