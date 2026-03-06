import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, PenLine, Send, Link2 } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`

  return (
    <div className="flex min-h-screen bg-linen">
      <nav className="w-56 bg-sidebar flex flex-col p-5 gap-1 shrink-0 border-r border-border/60">
        <p className="font-serif text-xl text-ink mb-5 px-3">Dear Friends</p>

        <Link href="/dashboard" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <Users size={15} />
          Contacts
        </Link>
        <Link href="/dashboard/compose" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <PenLine size={15} />
          Compose
        </Link>
        <Link href="/dashboard/export" className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink px-3 py-2 rounded-lg hover:bg-linen/60 transition-colors">
          <Send size={15} />
          Export &amp; Send
        </Link>

        <div className="mt-auto pt-4 border-t border-border/60">
          <p className="text-xs text-ink-muted mb-1.5 flex items-center gap-1 px-3">
            <Link2 size={10} /> Share link
          </p>
          <a
            href={shareUrl}
            className="text-xs text-terra hover:text-terra-dark break-all px-3"
            target="_blank"
            rel="noreferrer"
          >
            {shareUrl}
          </a>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="bg-surface-raised rounded-2xl shadow-sm border border-border/60 p-6 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
