import { redirect } from 'next/navigation'
import { OnboardingForm } from '@/components/onboarding-form'
import { Postmark } from '@/components/ui/postmark'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/user-profile'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = getUserProfile(user)
  if (profile.hasCompletedOnboarding) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-linen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <Postmark />
          <div className="info-chip">A quick setup before you head inside</div>
          <h1 className="mt-5 font-serif text-4xl text-ink">What should your friends call you?</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink-muted">
            We&apos;ll use your name to personalize address requests and make your first dashboard tour feel a little more welcoming.
          </p>
        </div>

        <OnboardingForm email={user.email ?? ''} />
      </div>
    </main>
  )
}
