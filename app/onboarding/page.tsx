import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { Postmark } from '@/components/ui/postmark'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

const newsreader = "var(--font-newsreader), Georgia, serif"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (profile.hasCompletedOnboarding) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Postmark />
          <p className="info-chip">A quick setup before you head inside</p>
          <h1 style={{ fontFamily: newsreader, fontWeight: 400, fontSize: 36, marginTop: 20, color: '#1d2442' }}>
            What should your friends call you?
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            We&apos;ll use your name to personalize address requests and make your first dashboard tour feel a little more welcoming.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </main>
  )
}
