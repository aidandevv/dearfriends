import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, HeartHandshake, Mailbox, PenSquare, Sparkles, Star } from 'lucide-react'
import { Postmark } from '@/components/ui/postmark'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'Dear Friends',
  description: 'A warm, personal home for collecting mailing addresses and sending thoughtful updates.',
}

const highlights = [
  {
    title: 'Collect addresses gracefully',
    body: 'Send one simple link and let friends share the details you need without the usual spreadsheet shuffle.',
    icon: Mailbox,
  },
  {
    title: 'Write once, personalize often',
    body: 'Draft a single letter, drop in names, and keep every note feeling like it was written with care.',
    icon: PenSquare,
  },
  {
    title: 'Send the right way',
    body: 'Export for print, handwriting, or digital delivery so every update fits the relationship.',
    icon: HeartHandshake,
  },
]

const steps = [
  'Create a private share link for your people.',
  'Collect addresses, organize contacts, and draft your note.',
  'Export polished mailings or send digital letters when needed.',
]

const mockContacts = [
  { name: 'Maya Chen', mode: 'Print', place: 'Portland, OR' },
  { name: 'Eli Rivera', mode: 'Handwrite', place: 'Brooklyn, NY' },
  { name: 'Sana Patel', mode: 'Digital', place: 'Austin, TX' },
]

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        <section className="hero-glow relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-surface to-transparent" />
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="relative z-10 max-w-2xl animate-fade-up">
              <Postmark />
              <div className="info-chip">
                <Sparkles size={14} className="text-terra" />
                Thoughtful mailing lists for people who still send something real
              </div>
              <h1 className="mt-6 font-serif text-5xl leading-tight text-ink sm:text-6xl">
                Keep your people close, even when life keeps moving.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-ink-muted">
                Dear Friends helps you gather addresses, write personal updates, and send mail with the kind of warmth a plain CRM never quite reaches.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="btn-primary inline-flex items-center justify-center gap-2 shadow-sm">
                  Start your mailing list
                  <ArrowRight size={16} />
                </Link>
                <Link href="/about" className="btn-outline inline-flex items-center justify-center gap-2">
                  Learn how it works
                </Link>
              </div>
            </div>

            <div className="relative z-10 animate-fade-up lg:pl-6">
              <div className="animate-float-delayed absolute -left-8 top-12 hidden w-44 rounded-[1.5rem] border border-border/80 bg-surface-raised p-4 shadow-[0_18px_50px_rgba(35,18,9,0.08)] lg:block">
                <div className="info-chip w-fit border-0 bg-terra/10 text-terra">
                  <Star size={12} />
                  Personal touch
                </div>
                <p className="mt-3 font-serif text-xl text-ink">Holiday note</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">Preview with names already filled in.</p>
              </div>

              <div className="animate-float-slow relative rounded-[2rem] border border-border/80 bg-surface-raised p-5 shadow-[0_18px_50px_rgba(35,18,9,0.1)]">
                <div className="surface-panel overflow-hidden p-0">
                  <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Mailing dashboard</p>
                      <p className="mt-1 font-serif text-2xl text-ink">Spring update</p>
                    </div>
                    <div className="rounded-full bg-terra px-3 py-1 text-xs font-medium text-white">42 contacts</div>
                  </div>

                  <div className="grid gap-3 p-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-3">
                      {mockContacts.map(contact => (
                        <div key={contact.name} className="rounded-[1rem] border border-border/80 bg-surface-raised px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-serif text-lg text-ink">{contact.name}</p>
                              <p className="text-xs text-ink-muted">{contact.place}</p>
                            </div>
                            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink">
                              {contact.mode}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-[1rem] border border-border/80 bg-ink px-4 py-4 text-linen">
                        <p className="text-xs uppercase tracking-[0.3em] text-linen/70">Letter preview</p>
                        <p className="mt-2 font-serif text-2xl">Dear Maya,</p>
                        <p className="mt-2 text-sm leading-6 text-linen/80">
                          Here&apos;s a little update from our year. Hope something lovely finds its way to your mailbox soon.
                        </p>
                      </div>
                      <div className="rounded-[1rem] border border-border/80 bg-surface px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Ready to send</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-surface-raised px-2 py-3">
                            <p className="font-serif text-xl text-ink">12</p>
                            <p className="mt-1 text-ink-muted">Print</p>
                          </div>
                          <div className="rounded-xl bg-surface-raised px-2 py-3">
                            <p className="font-serif text-xl text-ink">18</p>
                            <p className="mt-1 text-ink-muted">Handwrite</p>
                          </div>
                          <div className="rounded-xl bg-surface-raised px-2 py-3">
                            <p className="font-serif text-xl text-ink">12</p>
                            <p className="mt-1 text-ink-muted">Digital</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map(({ title, body, icon: Icon }) => (
              <article key={title} className="section-card hover-lift animate-fade-up px-6 py-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terra/10 text-terra">
                  <Icon size={22} />
                </div>
                <h2 className="mt-5 font-serif text-2xl text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

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
