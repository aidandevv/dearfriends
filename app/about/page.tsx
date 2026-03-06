import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Postmark } from '@/components/ui/postmark'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'About | Dear Friends',
  description: 'Learn how Dear Friends helps you collect addresses, personalize letters, and send thoughtful updates.',
}

const pillars = [
  {
    title: 'A gracious public form',
    body: 'Recipients get a clean, mobile-friendly page to share their mailing details without signing up for anything.',
    icon: Mail,
  },
  {
    title: 'One place for your people',
    body: 'Your dashboard keeps contacts, delivery preferences, and letter drafts together so seasonal mailings stay manageable.',
    icon: CheckCircle2,
  },
  {
    title: 'Built for trust',
    body: 'Verification links help you keep addresses current, and the overall experience stays focused on simple, respectful communication.',
    icon: ShieldCheck,
  },
]

const faqs = [
  {
    question: 'Who is Dear Friends for?',
    answer: 'Anyone maintaining a personal mailing list: holiday card senders, newlyweds, frequent movers, community organizers, or people who like to keep in touch offline.',
  },
  {
    question: 'What can I send?',
    answer: 'Holiday letters, life updates, invitations, thank-you notes, change-of-address announcements, or any message that benefits from a personal touch.',
  },
  {
    question: 'Why not just use a spreadsheet?',
    answer: 'You can, but Dear Friends adds graceful collection links, personalization, verification, and export tools without losing the intimacy of the project.',
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="hero-glow mx-auto w-full max-w-6xl px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="max-w-xl animate-fade-up">
            <Postmark />
            <p className="info-chip">
              <Sparkles size={14} className="text-terra" />
              What Dear Friends is all about
            </p>
            <h1 className="mt-6 font-serif text-5xl leading-tight text-ink">A warmer home for mailing lists and meaningful updates.</h1>
            <p className="mt-6 text-lg leading-8 text-ink-muted">
              Dear Friends was made for the moments when keeping in touch deserves more care than a bare spreadsheet but less complexity than heavy-duty CRM software.
            </p>
          </div>

          <div className="section-card animate-fade-up px-8 py-8">
            <h2 className="font-serif text-3xl text-ink">What you can do here</h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-ink-muted">
              <p>
                Gather mailing addresses through a simple public link, then keep everyone organized in a private dashboard designed around real correspondence.
              </p>
              <p>
                Write one thoughtful letter, personalize it with names, and choose whether each contact should receive something handwritten, printed, or digital.
              </p>
              <p>
                When it is time to send, export the formats you need or run quick verification check-ins to make sure every address still feels current.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {pillars.map(({ title, body, icon: Icon }) => (
            <article key={title} className="section-card hover-lift px-6 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terra/10 text-terra">
                <Icon size={22} />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="section-card px-8 py-8">
            <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">How it feels</p>
            <h2 className="mt-4 font-serif text-4xl text-ink">Calm, personal, and ready for real mail.</h2>
            <div className="mt-6 space-y-4 text-base leading-8 text-ink-muted">
              <p>
                The project leans into the ritual of keeping an address book: warm colors, serif headlines, and a mailing flow that feels more like stationery than admin software.
              </p>
              <p>
                That same tone carries through the share form and verification pages, so the people receiving your link get an experience that feels intentional instead of transactional.
              </p>
            </div>
          </div>

          <div className="section-card px-8 py-8">
            <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">Questions</p>
            <div className="mt-6 space-y-5">
              {faqs.map(faq => (
                <div key={faq.question} className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0">
                  <h3 className="font-serif text-2xl text-ink">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-ink-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-border bg-ink px-8 py-10 text-linen shadow-[0_18px_50px_rgba(35,18,9,0.12)] md:flex md:items-center md:justify-between md:gap-8">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-linen/70">Ready to start?</p>
            <h2 className="mt-3 font-serif text-4xl">Open the dashboard and begin gathering addresses.</h2>
            <p className="mt-4 text-base leading-7 text-linen/80">
              Set up your list, share your form, and send something that feels worth opening.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-linen px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-white"
            >
              Go to dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
