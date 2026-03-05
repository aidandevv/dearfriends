import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLetterPdf } from '@/lib/pdf'

export async function GET() {
  const supabase = await createClient()

  const [{ data: draft }, { data: contacts }] = await Promise.all([
    supabase.from('letter_drafts').select('body').maybeSingle(),
    supabase.from('contacts').select('first_name, last_name').eq('delivery_method', 'print').eq('opted_out', false),
  ])

  if (!draft?.body) return NextResponse.json({ error: 'No draft saved.' }, { status: 400 })
  if (!contacts?.length) return NextResponse.json({ error: 'No print contacts.' }, { status: 400 })

  const buffer = await generateLetterPdf(contacts, draft.body)
  const bytes = new Uint8Array(buffer)

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="letters.pdf"',
    },
  })
}
