import { Suspense } from 'react'
import { LetterComposer } from '@/components/letter-composer'
import { GroupFilter } from '@/components/group-filter'
import { getDraft, getRandomContact } from '@/lib/actions/letter'
import { getGroups, getContactsByGroup } from '@/lib/actions/groups'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const params = await searchParams
  const groupId = params.group ?? null

  const [draft, groups, groupContacts] = await Promise.all([
    getDraft(),
    getGroups(),
    getContactsByGroup(groupId),
  ])

  const contact = groupContacts.length > 0
    ? groupContacts[Math.floor(Math.random() * groupContacts.length)]
    : await getRandomContact()

  return (
    <div className="space-y-5 p-6">
      <section className="surface-panel px-6 py-5">
        <p className="eyebrow">At the writing desk</p>
        <h1 className="dash-title">Write something</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">
          Say it once. Their name drops in for each person, and you can read it back before it goes out.
        </p>
        {groups.length > 0 && (
          <div className="mt-4">
            <Suspense>
              <GroupFilter groups={groups} />
            </Suspense>
          </div>
        )}
      </section>

      <LetterComposer initialSubject={draft.subject} initialBody={draft.body} previewContact={contact} />
    </div>
  )
}
