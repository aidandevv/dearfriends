import Link from 'next/link'
import { MailQuestion } from 'lucide-react'
import { PostalLineArt } from '@/components/ui/postal-line-art'

export default function NotFound() {
  return (
    <main className="postal-page flex items-center justify-center px-6 py-12 text-ink">
      <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
      <section className="postal-page-content postal-card postal-card-plain w-full max-w-md px-7 py-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-periwinkle text-periwinkle">
          <MailQuestion size={26} strokeWidth={1.5} />
        </div>
        <p className="eyebrow justify-center">Return to sender</p>
        <h1 className="dash-title">This page got lost in the mail.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink-muted">
          The link may be old, mistyped, or no longer available.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-primary inline-flex min-h-11 items-center justify-center px-5">
            Go home
          </Link>
          <Link href="/login" className="btn-outline inline-flex min-h-11 items-center justify-center px-5">
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
