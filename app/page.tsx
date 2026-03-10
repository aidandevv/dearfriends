import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Hero } from '@/components/marketing/hero'
import { Features } from '@/components/marketing/features'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'Dear Friends',
  description: 'A warm, personal home for collecting mailing addresses and sending thoughtful updates.',
}

const steps = [
  'Create a private share link for your people.',
  'Collect addresses, organize contacts, and draft your note.',
  'Export polished mailings or send digital letters when needed.',
]

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <Hero />
        <Features />

        <section className="border-y border-border/70 bg-surface/70">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="animate-fade-up">
              <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">How it flows</p>
              <h2 className="mt-4 font-serif text-4xl text-ink">A simple rhythm for meaningful mail.</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-ink-muted">
                Built for holiday letters, moving announcements, wedding updates, or anyone trying to keep a personal mailing list from turning into a mess.
              </p>
            </div>
            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div key={step} className="section-card hover-lift flex gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-linen">
                    0{index + 1}
                  </div>
                  <p className="pt-1 text-base leading-7 text-ink">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="rounded-[2rem] border border-border bg-ink px-8 py-10 text-linen shadow-[0_18px_50px_rgba(35,18,9,0.12)] md:flex md:items-center md:justify-between md:gap-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-linen/70">For personal updates that matter</p>
              <h2 className="mt-3 font-serif text-4xl">Less admin. More connection.</h2>
              <p className="mt-4 text-base leading-7 text-linen/80">
                Keep your contacts current, your letters personal, and your mailing ritual something you actually look forward to.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 md:mt-0 md:min-w-56">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linen px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-white"
              >
                Go to dashboard
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full border border-linen/30 px-6 py-3 text-sm font-medium text-linen transition-colors hover:bg-white/10"
              >
                Read the full overview
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
