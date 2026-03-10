import { HeartHandshake, Mailbox, PenSquare } from 'lucide-react'

const features = [
  {
    number: '01',
    icon: Mailbox,
    title: 'Collect addresses gracefully',
    body: 'Send one simple link and let friends share the details you need without the usual spreadsheet shuffle. Works on any device, no account needed for recipients.',
  },
  {
    number: '02',
    icon: PenSquare,
    title: 'Write once, personalize often',
    body: 'Draft a single letter, drop in names with {{first_name}} merge tags, and keep every note feeling like it was written with care. Live preview as you type.',
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Send the right way',
    body: 'Export for print, handwriting, or digital delivery so every update fits the relationship. CSV for labels, PDF for your printer, email for the rest.',
  },
]

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">What it does</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Everything a mailing list should be.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {features.map(({ number, icon: Icon, title, body }) => (
          <article
            key={number}
            className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface-raised px-6 py-7 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="absolute right-5 top-5 font-serif text-6xl font-bold leading-none text-border/60 select-none">
              {number}
            </span>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-terra/10 text-terra">
              <Icon size={22} />
            </div>
            <h3 className="font-serif text-2xl text-ink">{title}</h3>
            <p className="mt-3 text-sm leading-7 text-ink-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
