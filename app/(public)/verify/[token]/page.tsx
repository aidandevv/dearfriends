import { getVerificationContext } from '@/lib/actions/verification'
import { VerificationForm } from '@/components/verification-form'
import { Postmark } from '@/components/ui/postmark'
import { PostalLineArt } from '@/components/ui/postal-line-art'

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const context = await getVerificationContext(token)

  if (!context.valid) {
    return (
      <main className="postal-page flex items-center justify-center p-6">
        <PostalLineArt variant="compact" className="postal-art left-1/2 top-1/2 h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2" />
        <div className="postal-page-content postal-card postal-card-plain flex max-w-sm flex-col items-center gap-3 px-7 py-8 text-center">
          <Postmark />
          <h1 className="font-serif text-3xl text-ink">This link is no longer available.</h1>
          <p className="text-sm text-ink-muted">{context.error} Ask the sender for a new address-confirmation email.</p>
        </div>
      </main>
    )
  }

  return <VerificationForm token={token} context={context} />
}
