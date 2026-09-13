import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { DesktopCalendarScene } from './scenes/desktop/CalendarScene'
import { DesktopClosingScene } from './scenes/desktop/ClosingScene'
import { DesktopComposeScene } from './scenes/desktop/ComposeScene'
import { DesktopIntroScene } from './scenes/desktop/IntroScene'
import { DesktopMapScene } from './scenes/desktop/MapScene'
import { DesktopPeopleScene } from './scenes/desktop/PeopleScene'
import { DesktopSendScene } from './scenes/desktop/SendScene'

const cut = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />

export const DesktopPromo: React.FC = () => <TransitionSeries>
  <TransitionSeries.Sequence name="Intro" durationInFrames={90}><DesktopIntroScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Address book" durationInFrames={112}><DesktopPeopleScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Calendar" durationInFrames={112}><DesktopCalendarScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Composer" durationInFrames={175}><DesktopComposeScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Map" durationInFrames={112}><DesktopMapScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Delivery" durationInFrames={112}><DesktopSendScene /></TransitionSeries.Sequence>
  {cut}
  <TransitionSeries.Sequence name="Closing" durationInFrames={91}><DesktopClosingScene /></TransitionSeries.Sequence>
</TransitionSeries>
