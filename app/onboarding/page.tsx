import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { Postmark } from '@/components/ui/postmark'
import { PostalLineArt } from '@/components/ui/postal-line-art'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const newsreader = "var(--font-ppwriter), Georgia, serif"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (profile.hasCompletedOnboarding) redirect('/dashboard')

  return (
    <main className="postal-page flex items-center justify-center p-6">
      <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
      <div className="postal-page-content w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Postmark />
          <p className="info-chip">A quick setup before you head inside</p>
          <h1 style={{ fontFamily: newsreader, fontWeight: 400, fontSize: 36, marginTop: 20, color: 'var(--ink)' }}>
            What should your friends call you?
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            We&apos;ll use your name to personalize address requests and make your first dashboard tour feel more personal.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </main>
  )
}
