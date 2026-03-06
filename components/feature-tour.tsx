'use client'

import { useMemo, useState } from 'react'
import { Link2, PenSquare, Send, Sparkles, Users } from 'lucide-react'
import { markTourSeen } from '@/lib/actions/user'

const steps = [
  {
    title: 'Keep your people organized',
    description: 'The contacts view is your address book. Update delivery methods, check verification status, and keep everyone in one calm place.',
    icon: Users,
    eyebrow: 'Contacts',
  },
  {
    title: 'Write once, personalize often',
    description: 'Compose your update with merge tags like {{first_name}} so each letter still feels personal.',
    icon: PenSquare,
    eyebrow: 'Compose',
  },
  {
    title: 'Choose how each note goes out',
    description: 'Export print files, build PDFs, or send digital letters when that is the better fit.',
    icon: Send,
    eyebrow: 'Export & Send',
  },
  {
    title: 'Share your address request link',
    description: 'Your dashboard includes a private share link so friends can send their mailing details without a long back-and-forth.',
    icon: Link2,
    eyebrow: 'Share Link',
  },
]

export function FeatureTour({ initialOpen = false, name }: { initialOpen?: boolean; name?: string | null }) {
  const [open, setOpen] = useState(initialOpen)
  const [stepIndex, setStepIndex] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = steps[stepIndex]
  const StepIcon = step.icon
  const isLastStep = stepIndex === steps.length - 1
  const firstName = useMemo(() => name?.trim().split(/\s+/)[0] ?? null, [name])

  if (!open) return null

  async function finishTour() {
    setFinishing(true)
    setError(null)

    const result = await markTourSeen()
    if (result.error) {
      setError(result.error)
      setFinishing(false)
      return
    }

    setOpen(false)
    setFinishing(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border/80 bg-surface-raised p-6 shadow-[0_24px_80px_rgba(35,18,9,0.18)] animate-fade-up">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
          <div>
            <div className="info-chip">
              <Sparkles size={14} className="text-terra" />
              Welcome tour
            </div>
            <h2 className="mt-4 font-serif text-4xl text-ink">
              {firstName ? `Welcome, ${firstName}.` : 'Welcome in.'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
              Here&apos;s a quick look at the pieces you&apos;ll use most often as you build your mailing list.
            </p>
          </div>
          <button
            type="button"
            onClick={finishTour}
            disabled={finishing}
            className="text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
          >
            Skip
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-[200px_minmax(0,1fr)] md:items-start">
          <div className="grid gap-2">
            {steps.map((tourStep, index) => (
              <button
                key={tourStep.title}
                type="button"
                onClick={() => setStepIndex(index)}
                className={index === stepIndex
                  ? 'rounded-[1.2rem] border border-terra bg-terra/10 px-4 py-3 text-left'
                  : 'rounded-[1.2rem] border border-border/80 bg-surface px-4 py-3 text-left'}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">0{index + 1}</p>
                <p className="mt-1 font-medium text-ink">{tourStep.eyebrow}</p>
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-border/80 bg-surface p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terra/10 text-terra">
              <StepIcon size={22} />
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.22em] text-ink-muted">{step.eyebrow}</p>
            <h3 className="mt-2 font-serif text-3xl text-ink">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-ink-muted">{step.description}</p>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStepIndex(current => Math.max(0, current - 1))}
                disabled={stepIndex === 0}
                className="btn-outline min-h-11 px-5 disabled:opacity-50"
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  type="button"
                  onClick={finishTour}
                  disabled={finishing}
                  className="btn-primary min-h-11 px-5"
                >
                  {finishing ? 'Finishing...' : 'Start exploring'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStepIndex(current => Math.min(steps.length - 1, current + 1))}
                  className="btn-primary min-h-11 px-5"
                >
                  Next step
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
