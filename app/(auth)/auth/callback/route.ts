import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = getUserProfile(user)
  const destination = profile.hasCompletedOnboarding ? '/dashboard' : '/onboarding'

  return NextResponse.redirect(`${origin}${destination}`)
}
