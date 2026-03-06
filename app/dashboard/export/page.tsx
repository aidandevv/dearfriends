import { ExportPanel } from '@/components/export-panel'

export default function ExportPage() {
  return (
    <div className="space-y-5">
      <section className="surface-panel px-5 py-5">
        <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">Dispatch</p>
        <h1 className="mt-2 font-serif text-4xl text-ink">Export &amp; send</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          Choose the format that matches how each person should hear from you, from printed letters to digital sends.
        </p>
      </section>

      <ExportPanel />
    </div>
  )
}
