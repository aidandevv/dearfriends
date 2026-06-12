import type { Metadata } from 'next'
import { LandingNav } from '@/components/marketing/landing-nav'
import {
  Hero,
  HowItWorks,
  People,
  Reminders,
  Quote,
  Closing,
  Footer,
} from '@/components/marketing/sections'

export const metadata: Metadata = {
  title: 'dearfriends — real mail, for the people you’d miss',
  description:
    "dearfriends collects your friends' addresses, remembers their birthdays, and nudges you to send a card once in a while.",
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-porcelain text-ink">
      <div aria-hidden className="grain-cool pointer-events-none fixed inset-0 z-0" />
      <LandingNav />
      <main className="relative z-10">
        <Hero />
        <HowItWorks />
        <People />
        <Reminders />
        <Quote />
        <Closing />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
