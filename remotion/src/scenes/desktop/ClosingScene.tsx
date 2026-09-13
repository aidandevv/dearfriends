import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors, fade } from '../../design'
import { PromoHeadline, enter } from './ui'

export const DesktopClosingScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return <AbsoluteFill style={{ alignItems: 'center', backgroundColor: colors.periwinkle, color: colors.white, display: 'flex', justifyContent: 'center', overflow: 'hidden', padding: '72px 96px' }}>
    <div style={{ border: '2px dashed rgba(255,255,255,0.28)', borderRadius: 999, height: 1250, position: 'absolute', rotate: '-18deg', width: 1250 }} />
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', textAlign: 'center', ...enter(frame, fps, 4), scale: interpolate(frame, [0, 91], [0.985, 1.025], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}><PromoHeadline size={108} style={{ color: colors.white }}>Start your<br /><em>list.</em></PromoHeadline><p style={{ fontFamily: 'PP Writer, Georgia, serif', fontSize: 24, fontStyle: 'italic', margin: '24px 0 0', opacity: fade(frame, 22, 40) }}>Real mail, for the people you&apos;d miss.</p></div>
  </AbsoluteFill>
}
