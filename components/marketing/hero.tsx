import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const mockContacts = [
  { name: 'Maya Chen', mode: 'Print', place: 'Portland, OR' },
  { name: 'Eli Rivera', mode: 'Handwrite', place: 'Brooklyn, NY' },
  { name: 'Sana Patel', mode: 'Digital', place: 'Austin, TX' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink pt-24">
      {/* Warm radial glow behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/3 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #3358ba 0%, transparent 70%)' }}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        {/* Left: copy */}
        <div className="relative z-10 max-w-2xl">
          <h1 className="font-serif text-5xl leading-[1.1] text-linen sm:text-6xl lg:text-7xl">
            Your people deserve more than{' '}
            <em className="not-italic text-blue-ink">a group text.</em>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-linen/70">
            Grab everyone&apos;s address with one link, write something that actually sounds like you, and send it — printed, handwritten, or by email.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-ink px-7 py-3.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-blue-mid"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-linen/20 px-7 py-3.5 text-sm font-medium text-linen/80 transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-sm text-linen/40">No credit card. No fuss. Just your address book.</p>
        </div>

        {/* Right: floating UI mockup */}
        <div className="relative z-10 lg:pl-4">
          <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            {/* Mock dashboard card */}
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-surface-raised">
              <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Dashboard</p>
                  <p className="mt-0.5 font-serif text-xl text-ink">Spring update</p>
                </div>
                <div className="rounded-full bg-blue-ink px-3 py-1 text-xs font-medium text-white">Sample address book</div>
              </div>

              <div className="space-y-2.5 p-4">
                {mockContacts.map(contact => (
                  <div key={contact.name} className="flex items-center justify-between rounded-[1rem] border border-border/80 bg-linen/40 px-4 py-3">
                    <div>
                      <p className="font-serif text-base text-ink">{contact.name}</p>
                      <p className="text-xs text-ink-muted">{contact.place}</p>
                    </div>
                    <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-ink">
                      {contact.mode}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 bg-ink px-4 py-4 text-linen">
                <p className="text-[10px] uppercase tracking-widest text-linen/50">Letter preview</p>
                <p className="mt-1.5 font-serif text-xl">Dear Maya,</p>
                <p className="mt-1 text-sm leading-6 text-linen/70">
                  Here&apos;s a little update from our year. Hope something lovely finds its way to your mailbox soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to linen */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, #F8F3EA)' }}
      />
    </section>
  )
}
