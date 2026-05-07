import Link from 'next/link'
import { MailQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-6 py-12 text-ink">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-ink text-blue-ink">
          <MailQuestion size={26} strokeWidth={1.5} />
        </div>
        <p className="eyebrow justify-center">Return to sender</p>
        <h1 className="dash-title">This page got lost in the mail.</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-ink-muted">
          The link may be old, mistyped, or tucked into the wrong envelope.
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
