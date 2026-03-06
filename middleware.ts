import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserProfile } from '@/lib/user-profile'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  type CookieToSet = {
    name: string
    value: string
    options?: Parameters<(typeof supabaseResponse.cookies)['set']>[2]
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  if (!user && (isDashboardRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const profile = getUserProfile(user)

    if (!profile.hasCompletedOnboarding && isDashboardRoute) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    if (profile.hasCompletedOnboarding && isOnboardingRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding'],
}
