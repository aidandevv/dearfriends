import { LetterComposer } from '@/components/letter-composer'
import { getDraft, getRandomContact } from '@/lib/actions/letter'

export default async function ComposePage() {
  const [draft, contact] = await Promise.all([getDraft(), getRandomContact()])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Compose</h1>
      <LetterComposer initialSubject={draft.subject} initialBody={draft.body} previewContact={contact} />
    </div>
  )
}
