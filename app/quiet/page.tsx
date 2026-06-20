import type { Metadata } from 'next'
import Link from 'next/link'
import { PostalLineArt } from '@/components/ui/postal-line-art'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'dearfriends — quiet concept',
  description: 'A simpler, more personal landing page concept for dearfriends.',
}

export default function QuietConceptPage() {
  return (
    <main className={styles.page}>
      <PostalLineArt variant="full" className={styles.lineArt} />
      <nav className={styles.nav} aria-label="Quiet concept navigation">
        <Link className={styles.brand} href="/">
          <span>dear</span>friends
          <i aria-hidden />
        </Link>

        <div className={styles.navLinks}>
          <a href="#why">Why</a>
          <a href="#nudge">A nudge</a>
          <a href="#letter">A letter</a>
        </div>

        <Link className={styles.navAction} href="/login">
          Begin
        </Link>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>A private address list for people you want to keep close.</p>
          <h1>
            Write to the people you&apos;d <em>miss</em>, before another year quietly slips by.
          </h1>
          <p className={styles.heroText}>
            Keep their addresses in one place, remember the days that matter, and send a small
            nudge to actually put something in the mail.
          </p>

          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/login">
              Start your list
            </Link>
            <a className={styles.textAction} href="#why">
              why it exists
            </a>
          </div>
        </div>

        <div className={styles.envelope} aria-label="Sample envelope addressed to Hana Okafor">
          <div className={styles.envelopeFold} aria-hidden />
          <div className={styles.stamp}>df</div>
          <address>
            Hana Okafor
            <br />
            214 Linden St., Apt 3
            <br />
            Brooklyn, NY 11221
          </address>
        </div>
      </section>

      <section id="why" className={styles.why}>
        <div className={styles.readerBlock}>
          <p className={styles.smallCaps}>Why this exists</p>
          <p>
            Keeping in touch is easy to mean well about and surprisingly easy to postpone. Busy
            weeks become quiet months, even with people who matter.
          </p>
          <p>
            dearfriends keeps addresses and meaningful dates together, then gives you enough notice
            to write before the moment passes.
          </p>
          <p>No feed. No streaks. No notifications begging for your attention.</p>
        </div>
      </section>

      <section id="nudge" className={styles.nudgeSection}>
        <div className={styles.nudgeIntro}>
          <p className={styles.smallCaps}>A nudge worth getting</p>
          <h2>Not a notification. A reason to write.</h2>
          <p>
            dearfriends only speaks up when there is enough time to do something thoughtful.
          </p>
        </div>

        <article className={styles.nudge}>
          <header>
            <span>Tuesday morning</span>
            <span>for you only</span>
          </header>

          <div className={styles.nudgeBody}>
            <p className={styles.nudgeTo}>Mira&apos;s birthday is next Thursday.</p>
            <p>
              Write by Friday to give your note time to arrive. Start with something small and
              specific while the date is still ahead of you.
            </p>
          </div>

          <footer>
            <Link href="/login">Start a note</Link>
            <span>or let this one pass quietly</span>
          </footer>
        </article>
      </section>

      <section id="keeps" className={styles.keeps}>
        <div className={styles.keepsInner}>
          <h2>It remembers the part that&apos;s easy to forget.</h2>
          <dl>
            <div>
              <dt>Addresses</dt>
              <dd>Add them yourself, or send a private link and let someone fill in their own.</dd>
            </div>
            <div>
              <dt>Days</dt>
              <dd>Birthdays, moving dates, anniversaries, and the odd day that only matters to you.</dd>
            </div>
            <div>
              <dt>Letters</dt>
              <dd>A place to start. Print at home, write by hand, or just keep the thought.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="letter" className={styles.letterSection}>
        <article className={styles.letter}>
          <p className={styles.smallCaps}>Sample letter</p>
          <time dateTime="2026-04-26">April 26, 2026</time>
          <p className={styles.greeting}>Dear Mira,</p>
          <p>
            I&apos;ve been meaning to write before another season slips by. I hope the new place is
            beginning to feel like home.
          </p>
          <p>
            Tell me what has been filling your days lately. I&apos;d love to hear the small things,
            not just the headline version.
          </p>
          <p className={styles.signoff}>Yours, always.</p>
        </article>

        <p className={styles.letterNote}>
          dearfriends keeps the practical details nearby, so there is less friction between meaning
          to write and actually beginning.
        </p>
      </section>

      <section className={styles.close}>
        <h2>
          The people who matter won&apos;t know <em>unless you tell them.</em>
        </h2>
        <p>Set up your list today. It takes about four minutes.</p>
        <Link className={styles.primaryAction} href="/login">
          Begin writing
        </Link>
      </section>

      <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="/">
          dearfriends
        </Link>
        <div>
          <a href="mailto:hi@dearfriends.co">hi@dearfriends.co</a>
        </div>
        <span>2026</span>
      </footer>
    </main>
  )
}
