import { useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../../design'
import { DesktopBackground, PromoHeadline, enter } from './ui'

export const DesktopIntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return <DesktopBackground>
    <div style={{ alignItems: 'center', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', textAlign: 'center', ...enter(frame, fps, 6) }}>
      <PromoHeadline size={118} style={{ maxWidth: 1120 }}>Keep up with<br />your <em style={{ color: colors.periwinkle }}>people.</em></PromoHeadline>
      <p style={{ color: colors.soft, fontSize: 25, lineHeight: 1.45, margin: '26px 0 0', maxWidth: 640 }}>Addresses, dates, letters, and the nudge to actually send something.</p>
    </div>
  </DesktopBackground>
}
