import type { CSSProperties, ReactNode } from 'react'
import { CalendarDays, Layers, Map, PenLine, Send, Users, type LucideIcon } from 'lucide-react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { colors, font, rise } from '../../design'

export const DesktopBackground: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: colors.porcelain, backgroundImage: 'radial-gradient(rgba(35, 41, 64, 0.035) 1px, transparent 1px)', backgroundSize: '3px 3px', color: colors.ink, fontFamily: font.sans, overflow: 'hidden' }}>
    <AbsoluteFill style={{ padding: '64px 96px 52px' }}>{children}</AbsoluteFill>
  </AbsoluteFill>
)

export const PromoHeadline: React.FC<{ children: ReactNode; size?: number; style?: CSSProperties }> = ({ children, size = 74, style }) => <h1 style={{ fontFamily: font.display, fontSize: size, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 0.94, margin: 0, ...style }}>{children}</h1>

export const AppWindow: React.FC<{ camera?: 'in' | 'out'; children: ReactNode; style?: CSSProperties }> = ({ camera = 'in', children, style }) => {
  const frame = useCurrentFrame()
  const zoom = interpolate(frame, [0, 160], camera === 'in' ? [0.982, 1.018] : [1.018, 0.99], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const { scale: entryScaleValue, ...windowStyle } = style ?? {}
  const entryScale = typeof entryScaleValue === 'number' ? entryScaleValue : 1
  return <div style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 24, boxShadow: '0 36px 80px -42px rgba(35,41,64,0.32)', overflow: 'hidden', ...windowStyle, scale: zoom * entryScale }}>
    {children}
  </div>
}

export const enter = (frame: number, fps: number, delay = 0) => ({ opacity: rise(frame, fps, delay), scale: interpolate(rise(frame, fps, delay), [0, 1], [0.975, 1]), translate: `0 ${interpolate(rise(frame, fps, delay), [0, 1], [26, 0])}px` })

const navItems: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Users, label: 'Contacts' },
  { icon: Map, label: 'Map' },
  { icon: CalendarDays, label: 'Calendar' },
  { icon: Layers, label: 'Groups' },
  { icon: PenLine, label: 'Compose' },
  { icon: Send, label: 'Export & Send' },
]

export const ChromeNav: React.FC<{ active: string }> = ({ active }) => <aside style={{ backgroundColor: 'rgba(248,249,251,0.88)', borderRight: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', gap: 2, padding: '26px 18px 24px', width: 220 }}>
  {navItems.map(({ icon: Icon, label }) => {
    const isActive = active === label
    return <div key={label} style={{ alignItems: 'center', backgroundColor: isActive ? colors.periwinkle : 'transparent', borderRadius: 10, boxShadow: isActive ? '0 2px 0 0 #1e2b66, 0 6px 16px -6px rgba(74,108,212,.45)' : 'none', color: isActive ? colors.white : colors.soft, display: 'flex', fontSize: 14.5, fontWeight: 500, gap: 12, padding: '10px 14px' }}><Icon color={isActive ? colors.white : '#516183'} size={17} /><span>{label}</span></div>
  })}
</aside>

export const DashboardMain: React.FC<{ children: ReactNode }> = ({ children }) => <main style={{ backgroundColor: colors.porcelain, flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
  <div style={{ background: `repeating-linear-gradient(-45deg, ${colors.periwinkle} 0 10px, transparent 10px 20px, ${colors.peach} 20px 30px, transparent 30px 40px)`, height: 6, opacity: 0.82 }} />
  <div style={{ padding: 24 }}>{children}</div>
</main>

export const AppPageHeader: React.FC<{ eyebrow: string; title: ReactNode; description: string }> = ({ eyebrow, title, description }) => <section style={{ backgroundColor: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, boxShadow: '0 24px 60px -30px rgba(35,41,64,0.24), 0 1px 0 rgba(255,255,255,0.75) inset', overflow: 'hidden', padding: '20px 24px', position: 'relative' }}>
  <div style={{ background: `repeating-linear-gradient(-45deg, ${colors.periwinkle} 0 7px, transparent 7px 14px, ${colors.peach} 14px 21px, transparent 21px 28px)`, height: 4, inset: '0 0 auto', opacity: 0.72, position: 'absolute' }} />
  <div style={{ alignItems: 'center', color: '#516183', display: 'flex', fontSize: 11, fontWeight: 600, gap: 8, letterSpacing: '0.18em', marginBottom: 10, textTransform: 'uppercase' }}><span style={{ backgroundColor: 'currentColor', height: 1, width: 18 }} />{eyebrow}</div>
  <h2 style={{ color: colors.ink, fontFamily: font.display, fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05, margin: '0 0 6px' }}>{title}</h2>
  <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.5, margin: 0, maxWidth: 740 }}>{description}</p>
</section>
