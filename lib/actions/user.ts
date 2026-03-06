'use server'

import { revalidatePath } from 'next/cache'
import { onboardingSchema } from '@/lib/schemas'
import { createClient } from '@/lib/supabase/server'

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
