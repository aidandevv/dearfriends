import { useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../../design'
import { AppPageHeader, AppWindow, ChromeNav, DashboardMain, DesktopBackground, PromoHeadline, enter } from './ui'

export const DesktopCalendarScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return <DesktopBackground>
    <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
      <div style={{ textAlign: 'center', ...enter(frame, fps, 3) }}><PromoHeadline>Remember the dates that <em style={{ color: colors.periwinkle }}>matter.</em></PromoHeadline><p style={{ color: colors.soft, fontSize: 20, lineHeight: 1.45, margin: '16px auto 28px', maxWidth: 570 }}>A gentle heads-up when there&apos;s still time to write.</p></div>
      <AppWindow camera="out" style={{ height: 570, maxWidth: 1500, width: '100%', ...enter(frame, fps, 12) }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <ChromeNav active="Calendar" />
          <DashboardMain>
            <div style={enter(frame, fps, 22)}><AppPageHeader eyebrow="Mailing rhythm" title="Calendar" description="Import birthdays and anniversaries, add custom dates, and let dearfriends estimate when each note should go out." /></div>
            <section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 20px 50px -30px rgba(35,41,64,0.2), 0 1px 0 rgba(255,255,255,0.72) inset', marginTop: 20, overflow: 'hidden', ...enter(frame, fps, 32) }}>
              <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', padding: '14px 20px' }}><span style={{ color: colors.soft, fontSize: 14 }}>‹</span><span style={{ fontFamily: 'PP Writer, Georgia, serif', fontSize: 18 }}>August 2026</span><span style={{ color: colors.soft, fontSize: 14 }}>›</span></div>
              <div style={{ backgroundColor: 'rgba(248,249,251,0.7)', borderBottom: `1px solid ${colors.line}`, borderTop: `1px solid ${colors.line}`, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} style={{ color: colors.muted, fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', padding: '8px 0', textAlign: 'center', textTransform: 'uppercase' }}>{day}</span>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{Array.from({ length: 28 }, (_, index) => <div key={index} style={{ alignItems: 'center', backgroundColor: index === 12 ? colors.periwinkle : index === 16 ? 'rgba(184,69,59,0.86)' : index < 3 ? 'rgba(248,249,251,0.3)' : colors.white, borderBottom: `1px solid ${colors.line}`, borderRight: `1px solid ${colors.line}`, color: index === 12 || index === 16 ? colors.white : index < 3 ? colors.muted : colors.ink, display: 'flex', fontSize: 13, fontWeight: 500, height: 31, justifyContent: 'center', ...enter(frame, fps, 38 + index * 1.4) }}>{index + 1}</div>)}</div>
              <article style={{ alignItems: 'center', backgroundColor: 'rgba(248,249,251,0.6)', display: 'flex', justifyContent: 'space-between', padding: '11px 16px', ...enter(frame, fps, 70) }}><div><strong style={{ fontSize: 14 }}>Hana&apos;s birthday</strong><span style={{ color: colors.muted, fontSize: 12, marginLeft: 9 }}>August 17</span></div><span style={{ color: '#B8453B', fontSize: 12, fontWeight: 700 }}>Mail by Tuesday</span></article>
            </section>
          </DashboardMain>
        </div>
      </AppWindow>
    </div>
  </DesktopBackground>
}
