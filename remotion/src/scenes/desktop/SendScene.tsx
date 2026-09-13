import { FileDown, FileText, Send } from 'lucide-react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../../design'
import { AppPageHeader, AppWindow, ChromeNav, DashboardMain, DesktopBackground, PromoHeadline, enter } from './ui'

const options = [
  { description: 'Avery-ready address files for your own printer and stamps.', icon: FileText, label: 'Labels', title: 'CSV export' },
  { description: 'One personalized page per contact — ready to print at home.', icon: FileDown, label: 'Letters', title: 'PDF export' },
  { description: 'Email to contacts marked digital.', icon: Send, label: 'Email', title: 'Digital send' },
]

export const DesktopSendScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return <DesktopBackground>
    <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
      <div style={{ textAlign: 'center', ...enter(frame, fps, 3) }}><PromoHeadline>Export &amp; send.</PromoHeadline><p style={{ color: colors.soft, fontSize: 20, lineHeight: 1.45, margin: '16px auto 28px', maxWidth: 620 }}>Export labels and letter PDFs for mail you send yourself, or email contacts marked digital.</p></div>
      <AppWindow camera="in" style={{ height: 570, maxWidth: 1500, width: '100%', ...enter(frame, fps, 12) }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <ChromeNav active="Export & Send" />
          <DashboardMain>
            <div style={enter(frame, fps, 22)}><AppPageHeader eyebrow="Sending" title="Export & send" description="Export labels and letter PDFs for mail you send yourself, or email contacts marked digital. Dear Friends is your address book and composer — not a mailing service." /></div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 20 }}>
              {options.map(({ description, icon: Icon, label, title }, index) => <section key={label} style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 20px 50px -30px rgba(35,41,64,0.2), 0 1px 0 rgba(255,255,255,0.72) inset', minHeight: 212, padding: 20, ...enter(frame, fps, 36 + index * 11) }}>
                <div style={{ alignItems: 'center', backgroundColor: 'rgba(74,108,212,0.1)', border: `1px solid ${colors.line}`, borderRadius: 99, color: colors.periwinkle, display: 'flex', height: 40, justifyContent: 'center', width: 40 }}><Icon size={18} strokeWidth={1.6} /></div>
                <p style={{ color: '#516183', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', margin: '16px 0 5px', textTransform: 'uppercase' }}>{label}</p>
                <h3 style={{ fontFamily: 'PP Writer, Georgia, serif', fontSize: 22, fontWeight: 400, margin: 0 }}>{title}</h3>
                <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.35, margin: '6px 0 0' }}>{description}</p>
                <button style={{ backgroundColor: index === 2 ? colors.periwinkle : colors.white, border: `1px solid ${index === 2 ? colors.periwinkle : colors.line}`, borderRadius: 999, color: index === 2 ? colors.white : colors.ink, fontSize: 13, fontWeight: 500, marginTop: 14, padding: '8px 12px' }}>{index === 2 ? 'Send to 4' : 'Download'}</button>
              </section>)}
            </div>
          </DashboardMain>
        </div>
      </AppWindow>
    </div>
  </DesktopBackground>
}
