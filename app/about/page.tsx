import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'About | dearfriends',
  description: 'Why I built dearfriends — a small, personal way to keep up with the people you love by mail.',
}

const serif = "var(--font-ppwriter), Georgia, serif"

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="mx-auto w-full max-w-2xl px-6 py-24">
        <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18 }} className="text-blue-slate">
          A note about this
        </p>

        <h1
          style={{ fontFamily: serif, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.08 }}
          className="mt-4 text-[clamp(34px,5vw,52px)] text-ink text-pretty"
        >
          I built this because I kept meaning to write.
        </h1>

        <div
          style={{ fontFamily: serif, fontSize: 'clamp(18px,2.2vw,21px)', lineHeight: 1.7 }}
          className="mt-10 flex flex-col gap-6 text-ink"
        >
          <p>
            For years I told myself I&apos;d send the card, mail the letter, write back
            the friend who moved away. I rarely did. The address was in one
            place, the birthday in another, and the moment always seemed to
            pass before I got around to it.
          </p>
          <p>
            So I made dearfriends &mdash; a small, quiet place to keep the
            addresses and the dates that matter, and to nudge me before each one
            arrives. It&apos;s really just an address book that gently taps me on
            the shoulder.
          </p>
          <p>
            There&apos;s no feed here, no streaks, no notifications competing for
            your attention. You add the people you care about, note the days
            worth remembering, and when one comes up you write something real
            &mdash; in your own words. Print it at home, or I&apos;ll stamp and
            mail it for you.
          </p>
          <p className="text-ink-soft">
            It started as a thing for me and a few hundred friends. If it helps
            you send one letter you&apos;d have otherwise only meant to, then it
            was worth building.
          </p>
        </div>

        <div className="mt-12 border-t border-border/70 pt-8">
          <Link
            href="/login"
            style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 18 }}
            className="text-blue-ink underline underline-offset-4 decoration-border hover:decoration-blue-ink"
          >
            Start your own little book →
          </Link>
        </div>
      </main>
    </SiteShell>
  )
}
