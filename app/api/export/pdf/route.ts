import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateLetterPdf } from '@/lib/pdf'
import { recordFirstSent } from '@/lib/actions/user'
import { DEFAULT_STYLE, type LetterStyle } from '@/lib/letter-templates'

export async function GET() {
  await recordFirstSent()
  const supabase = await createClient()

  const [{ data: draft }, { data: contacts }] = await Promise.all([
    supabase.from('letter_drafts').select('body, style').maybeSingle(),
    supabase.from('contacts').select('first_name, last_name').eq('delivery_method', 'print').eq('opted_out', false),
  ])

  if (!draft?.body) return NextResponse.json({ error: 'No draft saved.' }, { status: 400 })
  if (!contacts?.length) return NextResponse.json({ error: 'No print contacts.' }, { status: 400 })

  const style = (draft.style as LetterStyle) ?? DEFAULT_STYLE
  const buffer = await generateLetterPdf(contacts, draft.body, style)
  const bytes = new Uint8Array(buffer)

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="letters.pdf"',
    },
  })
}
