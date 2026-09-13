import { loadFont } from '@remotion/fonts'
import { Easing, interpolate, spring, staticFile } from 'remotion'

await Promise.all([
  loadFont({ family: 'PP Writer', url: staticFile('fonts/PPWriter-RegularText.otf'), weight: '400' }),
  loadFont({ family: 'PP Writer', url: staticFile('fonts/PPWriter-RegularItalic.otf'), weight: '400', style: 'italic' }),
  loadFont({ family: 'DM Sans', url: staticFile('fonts/DMSans-VariableFont_opsz,wght.ttf'), weight: '100 900' }),
])

export const colors = { porcelain: '#F8F9FB', surface: '#EEF1F6', white: '#FFFFFF', ink: '#232940', soft: '#4A5168', muted: '#8A91A6', line: '#DFE3EC', periwinkle: '#4A6CD4', peach: '#E8927C', sage: '#5A7A5A' }
export const font = { display: 'PP Writer, Georgia, serif', sans: 'DM Sans, Arial, sans-serif' }
export const rise = (frame: number, fps: number, delay = 0) => spring({ fps, frame: frame - delay, config: { damping: 200, mass: 0.8, stiffness: 120 } })
export const fade = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1) })
export const settle = (frame: number, fps: number, delay = 0) => ({ opacity: rise(frame, fps, delay), translate: `0 ${interpolate(rise(frame, fps, delay), [0, 1], [38, 0])}px` })
