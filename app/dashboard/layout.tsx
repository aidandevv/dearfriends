import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/share/${user.id}`

  return (
    <div className="flex min-h-screen">
      <nav className="w-52 border-r bg-gray-50 flex flex-col gap-1 p-4 text-sm">
        <p className="font-semibold mb-3">NomadMail</p>
        <Link href="/dashboard" className="hover:underline">Contacts</Link>
        <Link href="/dashboard/compose" className="hover:underline">Compose</Link>
        <Link href="/dashboard/export" className="hover:underline">Export & Send</Link>
        <div className="mt-auto pt-4 border-t">
          <p className="text-xs text-gray-500 mb-1">Your share link:</p>
          <a href={shareUrl} className="text-xs text-blue-600 break-all" target="_blank" rel="noreferrer">
            {shareUrl}
          </a>
        </div>
      </nav>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
