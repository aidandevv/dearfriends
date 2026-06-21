import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLetterPdfContacts } from '@/lib/export-contacts'
import { generateLetterPdf } from '@/lib/pdf'
import { recordFirstSent } from '@/lib/actions/user'

export async function GET(request: Request) {
  await recordFirstSent()
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('group')

  const supabase = await createClient()

  const { data: draft } = await supabase.from('letter_drafts').select('subject, body').maybeSingle()
  if (!draft?.body) return NextResponse.json({ error: 'No draft saved.' }, { status: 400 })

  try {
    const contacts = await getLetterPdfContacts(supabase, groupId)
    if (!contacts.length) {
      return NextResponse.json({ error: 'No write-by-hand or print-at-home contacts.' }, { status: 400 })
    }

    const buffer = await generateLetterPdf(contacts, draft.body, draft.subject || undefined)
    const bytes = new Uint8Array(buffer)

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="letters.pdf"',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF export failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
