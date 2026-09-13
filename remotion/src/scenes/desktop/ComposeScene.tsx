import { useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../../design'
import { AppPageHeader, AppWindow, ChromeNav, DashboardMain, DesktopBackground, PromoHeadline, enter } from './ui'

const letter = 'Dear Jane,\n\nI have been meaning to write. I hope the new place is beginning to feel like home.\n\nThinking of you,'

export const DesktopComposeScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const typed = letter.slice(0, Math.max(0, Math.min(letter.length, Math.floor((frame - 43) * 1.15))))

  return <DesktopBackground>
    <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
      <div style={{ textAlign: 'center', ...enter(frame, fps, 2) }}><PromoHeadline>Compose your letter.</PromoHeadline><p style={{ color: colors.soft, fontSize: 20, lineHeight: 1.45, margin: '16px auto 28px', maxWidth: 560 }}>Draft once, personalize with merge tags, and check the live preview before you export or send.</p></div>
      <AppWindow camera="in" style={{ height: 570, maxWidth: 1500, width: '100%', ...enter(frame, fps, 20) }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <ChromeNav active="Compose" />
          <DashboardMain>
            <div style={enter(frame, fps, 28)}><AppPageHeader eyebrow="Writing desk" title="Compose your letter" description="Draft once, personalize with merge tags, and check the live preview before you export or send." /></div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginTop: 20 }}>
              <section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 20px 50px -30px rgba(35,41,64,0.2), 0 1px 0 rgba(255,255,255,0.72) inset', padding: 20, ...enter(frame, fps, 38) }}>
                <h3 style={{ fontFamily: 'PP Writer, Georgia, serif', fontSize: 24, fontWeight: 400, margin: 0 }}>Write your letter</h3>
                <div style={{ marginTop: 12 }}><span style={{ color: colors.soft, fontSize: 12, fontWeight: 500 }}>Subject</span><div style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 12, color: colors.muted, fontSize: 13, marginTop: 5, padding: '9px 12px' }}>Thinking of you</div></div>
                <div style={{ marginTop: 10 }}><span style={{ color: colors.soft, fontSize: 12, fontWeight: 500 }}>Letter body</span><div style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 12, color: colors.soft, fontFamily: 'DM Sans, Arial, sans-serif', fontSize: 13, lineHeight: 1.55, marginTop: 5, minHeight: 155, padding: 12, whiteSpace: 'pre-line' }}>{typed}<span style={{ color: colors.periwinkle, opacity: Math.sin(frame / 5) > 0 ? 1 : 0 }}>|</span></div></div>
                <span style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 999, color: colors.periwinkle, display: 'inline-block', fontFamily: 'monospace', fontSize: 12, marginTop: 10, padding: '7px 10px', ...enter(frame, fps, 64) }}>{'{{first_name}}'}</span>
              </section>
              <section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 20px 50px -30px rgba(35,41,64,0.2), 0 1px 0 rgba(255,255,255,0.72) inset', padding: 20, ...enter(frame, fps, 48) }}>
                <div style={{ alignItems: 'start', display: 'flex', justifyContent: 'space-between' }}><div><span style={{ color: colors.muted, fontSize: 12, fontWeight: 500 }}>Preview recipient</span><h3 style={{ fontFamily: 'PP Writer, Georgia, serif', fontSize: 24, fontWeight: 400, margin: '4px 0 0' }}>Jane Smith</h3></div><span style={{ backgroundColor: 'rgba(90,122,90,0.1)', borderRadius: 999, color: colors.sage, fontSize: 11, fontWeight: 500, padding: '7px 10px' }}>Live preview</span></div>
                <div style={{ borderTop: `1px solid ${colors.line}`, color: colors.ink, fontFamily: 'PP Writer, Georgia, serif', fontSize: 16, lineHeight: 1.55, marginTop: 14, minHeight: 218, paddingTop: 14, whiteSpace: 'pre-line' }}>{typed || 'Dear Jane,'}</div>
              </section>
            </div>
          </DashboardMain>
        </div>
      </AppWindow>
    </div>
  </DesktopBackground>
}
