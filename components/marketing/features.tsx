import { HeartHandshake, Mailbox, PenSquare } from 'lucide-react'

const features = [
  {
    number: '01',
    icon: Mailbox,
    title: "One link, everyone's address",
    body: 'Share a simple link and your friends fill in their own details. No awkward asking, no scattered texts, no spreadsheet chaos. They don\'t even need an account.',
  },
  {
    number: '02',
    icon: PenSquare,
    title: 'Write it once, make it personal',
    body: "Write your letter once and Dear Friends fills in each person's name for you. Every note feels personal — because it is.",
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Send however feels right',
    body: 'Some people get a printed letter, some get a handwritten card, some get an email. You pick for each person and Dear Friends handles the rest.',
  },
]

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-ink-muted">What it does</p>
        <h2 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Staying in touch shouldn&apos;t be this much work.
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
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-periwinkle/10 text-periwinkle">
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
