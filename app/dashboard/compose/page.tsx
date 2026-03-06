import { LetterComposer } from '@/components/letter-composer'
import { getDraft, getRandomContact } from '@/lib/actions/letter'

export default async function ComposePage() {
  const [draft, contact] = await Promise.all([getDraft(), getRandomContact()])

  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Composer</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">Compose your letter</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          Draft once, personalize with merge tags, and check the live preview before you export or send.
        </p>
      </section>

      <LetterComposer initialSubject={draft.subject} initialBody={draft.body} previewContact={contact} />
    </div>
  )
}
