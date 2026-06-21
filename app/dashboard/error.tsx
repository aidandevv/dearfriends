'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="dashboard-page-pad app-page-stack">
      <section className="form-panel max-w-lg">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="dash-title">Dashboard error</h1>
        <p className="mt-2 text-sm text-ink-muted">{error.message}</p>
        <button type="button" onClick={reset} className="btn-primary mt-4 min-h-11 px-4 text-sm">
          Try again
        </button>
      </section>
    </div>
  )
}
