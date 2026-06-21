import Link from 'next/link'
import { PostalTimelineDesktopBg, PostalTimelineMobileBg } from './postal-timeline-bg'
import { Reveal } from './reveal'

// ─── Shared bits ─────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-periwinkle">
      <span aria-hidden className="h-px w-5 bg-periwinkle/60" />
      {children}
    </p>
  )
}

function SectionTitle({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2
      className={`font-serif font-normal text-ink ${center ? 'text-center' : ''}`}
      style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
    >
      {children}
    </h2>
  )
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-periwinkle px-7 text-[15px] font-medium text-white shadow-[0_6px_20px_-6px_rgba(74,108,212,0.55)] transition-all hover:bg-periwinkle-deep hover:shadow-[0_10px_26px_-6px_rgba(74,108,212,0.6)]"
    >
      {children}
      <ArrowIcon />
    </Link>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function VignetteCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[88px] flex-1 items-center justify-center rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_10px_30px_-14px_rgba(35,41,64,0.12)]">
      {children}
    </div>
  )
}

function DashedConnector() {
  return (
    <div aria-hidden className="flex items-center justify-center self-stretch">
      <span className="hidden h-px w-8 border-t border-dashed border-ink-muted/50 sm:block" />
      <span className="block h-6 w-px border-l border-dashed border-ink-muted/50 sm:hidden" />
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:px-10 sm:pt-40">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal>
          <h1
            className="font-serif font-normal text-ink"
            style={{ fontSize: 'clamp(42px, 7vw, 80px)', lineHeight: 1.02, letterSpacing: '-0.025em' }}
          >
            Real mail, for the people{' '}
            <em className="italic text-periwinkle">you&apos;d miss</em>.
          </h1>
        </Reveal>

        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft sm:text-[18px]">
            dearfriends collects your friends&apos; addresses, remembers their
            birthdays, and nudges you to send a card once in a while.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CtaButton href="/login">Start your list</CtaButton>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center gap-1.5 px-3 text-[15px] font-medium text-ink-soft transition-colors hover:text-periwinkle"
            >
              See how it works →
            </a>
          </div>
          <p className="mt-5 font-serif text-[17px] italic text-ink-muted">
            no app needed —{' '}
            <span className="underline decoration-peach decoration-2 underline-offset-4">just a link</span>
          </p>
        </Reveal>
      </div>

      {/* Vignette strip: link → address card → mailed card */}
      <Reveal delay={260}>
        <div className="mx-auto mt-16 flex max-w-3xl flex-col items-stretch sm:flex-row sm:items-center">
          <VignetteCard>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[14px] font-medium text-periwinkle">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M8.5 11.5l3-3M7 13l-1.5 1.5a2.5 2.5 0 01-3.5-3.5L4.5 8.5M13 7l1.5-1.5a2.5 2.5 0 013.5 3.5L15.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" transform="translate(0.5 0.5)" />
              </svg>
              dearfriends.co/you
            </span>
          </VignetteCard>

          <DashedConnector />

          <VignetteCard>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-periwinkle font-serif text-[15px] text-white">S</span>
              <div className="text-left">
                <p className="text-[14px] font-medium text-ink">Sam Beaumont</p>
                <p className="text-[12.5px] text-ink-muted">Portland, OR · added their address</p>
              </div>
            </div>
          </VignetteCard>

          <DashedConnector />

          <VignetteCard>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-8 items-center justify-center rounded-[4px] bg-peach shadow-sm">
                <span className="flex h-7 w-6 items-center justify-center rounded-[2px] border border-dashed border-white/80 font-serif text-[10px] italic text-white">df</span>
              </span>
              <div className="text-left">
                <p className="text-[14px] font-medium text-ink">You mail the card</p>
                <p className="text-[12.5px] text-ink-muted">labels + addresses exported</p>
              </div>
            </div>
          </VignetteCard>
        </div>
      </Reveal>
    </section>
  )
}

// ─── How it works ────────────────────────────────────────────────────────────

const steps = [
  {
    title: 'Share one link.',
    desc: 'Post it anywhere. Friends add their address in under a minute — no account needed.',
  },
  {
    title: 'Remember the dates.',
    desc: 'Birthdays and big days, with a nudge a week early.',
  },
  {
    title: 'Send something real.',
    desc: 'Export labels and letters, then you print, pen, and stamp. Digital contacts get email from the app.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-24 overflow-hidden bg-porcelain py-20 sm:py-28">
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-10">
        <Reveal>
          <Eyebrow>How it works</Eyebrow>
          <SectionTitle>Three small habits.</SectionTitle>
        </Reveal>
      </div>

      <div className="relative mt-12 hidden h-[430px] sm:block">
        <PostalTimelineDesktopBg className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="relative z-10 mx-auto grid h-full max-w-6xl grid-cols-3 px-10">
          {steps.map((step, i) => (
            <Reveal
              key={step.title}
              delay={i * 100}
              className={[
                'w-full max-w-[310px]',
                i === 0 ? 'self-start justify-self-start pt-3' : '',
                i === 1 ? 'self-end justify-self-center pb-2 text-center' : '',
                i === 2 ? 'self-start justify-self-end pt-3 text-right' : '',
              ].join(' ')}
            >
              <h3 className="font-serif text-[25px] font-normal text-ink" style={{ letterSpacing: '-0.015em' }}>
                {step.title}
              </h3>
              <p className={`mt-3 text-[15px] leading-relaxed text-ink-soft ${i === 1 ? 'mx-auto max-w-[280px]' : ''}`}>
                {step.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="relative mx-5 mt-10 h-[760px] sm:hidden">
        <PostalTimelineMobileBg className="pointer-events-none absolute inset-0 h-full w-full" />

        {steps.map((step, i) => (
          <Reveal
            key={step.title}
            delay={i * 90}
            className={[
              'absolute z-10 w-[43%]',
              i === 0 ? 'right-0 top-0' : '',
              i === 1 ? 'left-0 top-[31%] text-right' : '',
              i === 2 ? 'right-0 top-[61%]' : '',
            ].join(' ')}
          >
            <h3 className="font-serif text-[21px] font-normal leading-tight text-ink" style={{ letterSpacing: '-0.015em' }}>
              {step.title}
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-soft">{step.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ─── Your people ─────────────────────────────────────────────────────────────

const friends = [
  { initial: 'H', tint: 'bg-periwinkle', name: 'Hana Okafor', place: 'Brooklyn, NY', pill: 'birthday soon', pillClass: 'bg-periwinkle/10 text-periwinkle' },
  { initial: 'S', tint: 'bg-peach', name: 'Sam Beaumont', place: 'Portland, OR', pill: 'write back', pillClass: 'bg-peach/15 text-[#C56A52]' },
  { initial: 'D', tint: 'bg-blue-slate', name: 'Dad', place: 'Tucson, AZ', pill: 'family', pillClass: 'bg-surface text-ink-soft' },
  { initial: 'M', tint: 'bg-periwinkle-deep', name: 'Mira Väänänen', place: 'Helsinki, FI', pill: 'pen pal', pillClass: 'bg-periwinkle/10 text-periwinkle' },
]

export function People() {
  return (
    <section id="friends" className="scroll-mt-24 bg-surface/70">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
        <Reveal>
          <Eyebrow>Your people</Eyebrow>
          <SectionTitle>
            A private list of everyone{' '}
            <em className="italic text-periwinkle">you&apos;d miss</em>.
          </SectionTitle>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
            Just the people who matter — where they live, and the dates that deserve a real note in the mail.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-24px_rgba(35,41,64,0.18)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h4 className="font-serif text-[18px] font-medium text-ink">My people</h4>
              <span className="text-[12.5px] text-ink-muted">private address book</span>
            </div>
            {friends.map(friend => (
              <div key={friend.name} className="flex items-center gap-3.5 border-b border-line/70 px-5 py-3.5">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif text-[13px] text-white ${friend.tint}`}>
                  {friend.initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{friend.name}</p>
                  <p className="text-[12.5px] text-ink-muted">{friend.place}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${friend.pillClass}`}>
                  {friend.pill}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-ink-muted/50 text-[13px] text-ink-muted">+</span>
              <p className="text-[14px] text-ink-muted">add someone — or send your link</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Reminders ───────────────────────────────────────────────────────────────

export function Reminders() {
  return (
    <section id="reminders" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-10 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Reveal>
          <Eyebrow>Nudges, not notifications</Eyebrow>
          <SectionTitle>One quiet email when it&apos;s time.</SectionTitle>
          <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
            A heads-up before birthdays and a gentle note when someone hasn&apos;t
            heard from you in a while. No badges, no streaks.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(35,41,64,0.18)]">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-periwinkle/10 text-periwinkle">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M10 6v4l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-[15px] font-medium text-ink">Hana&apos;s birthday — next Friday</p>
                <p className="text-[12.5px] text-ink-muted">Sunday morning · dearfriends</p>
              </div>
            </div>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ink-soft">
              Mail by Tuesday to give it time to arrive. Start with a card, a note,
              or a few honest lines.
            </p>
            <div className="mt-5 flex gap-2.5">
              <span className="rounded-full bg-periwinkle px-4 py-2 text-[13px] font-medium text-white">Start a card</span>
              <span className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink-soft">Later</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Product principle ───────────────────────────────────────────────────────

export function ProductPrinciple() {
  return (
    <section className="border-y border-dashed border-line bg-surface/50">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-10 sm:py-24">
        <Reveal>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-periwinkle">
            A quieter kind of social
          </p>
          <h2
            className="mt-5 font-serif font-normal text-ink"
            style={{ fontSize: 'clamp(24px, 3vw, 38px)', lineHeight: 1.25, letterSpacing: '-0.015em' }}
          >
            Friendship doesn&apos;t need another feed.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft">
            Just a place to remember the people, dates, and small gestures that matter.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

// ─── Closing ─────────────────────────────────────────────────────────────────

export function Closing() {
  return (
    <section id="start" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-24 text-center sm:px-10 sm:py-32">
      <Reveal>
        <SectionTitle center>
          Someone&apos;s mailbox is{' '}
          <em className="italic text-periwinkle">waiting</em>.
        </SectionTitle>
        <p className="mt-5 text-[16px] text-ink-soft sm:text-[17px]">
          Setting up your list takes about four minutes.
        </p>
        <div className="mt-8 flex justify-center">
          <CtaButton href="/login">Start your list</CtaButton>
        </div>
        <p className="mt-10 text-[13.5px] text-ink-muted">
          Made for keeping in touch, one letter at a time.
        </p>
      </Reveal>
    </section>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export function Footer() {
  return (
    <footer className="border-t border-dashed border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-9 text-[13px] text-ink-muted sm:px-10">
        <p className="font-serif text-[16px] text-ink">
          <em className="italic">dear</em>friends
        </p>
        <ul className="flex flex-wrap items-center gap-6">
          <li><a href="mailto:hi@dearfriends.co" className="transition-colors hover:text-periwinkle">hi@dearfriends.co</a></li>
        </ul>
        <p>© 2026</p>
      </div>
    </footer>
  )
}
