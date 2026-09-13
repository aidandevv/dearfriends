import { Composition, Folder } from 'remotion'
import { DesktopPromo } from './DesktopPromo'
import { DesktopCalendarScene } from './scenes/desktop/CalendarScene'
import { DesktopClosingScene } from './scenes/desktop/ClosingScene'
import { DesktopComposeScene } from './scenes/desktop/ComposeScene'
import { DesktopIntroScene } from './scenes/desktop/IntroScene'
import { DesktopMapScene } from './scenes/desktop/MapScene'
import { DesktopPeopleScene } from './scenes/desktop/PeopleScene'
import { DesktopSendScene } from './scenes/desktop/SendScene'

const fps = 30
const width = 1920
const height = 1080

export const MyComposition: React.FC = () => {
  return (
    <>
      <Folder name="DearFriends-Desktop-Promo-Scenes">
        <Composition id="Desktop-Intro" component={DesktopIntroScene} durationInFrames={90} fps={fps} width={width} height={height} />
        <Composition id="Desktop-People" component={DesktopPeopleScene} durationInFrames={112} fps={fps} width={width} height={height} />
        <Composition id="Desktop-Calendar" component={DesktopCalendarScene} durationInFrames={112} fps={fps} width={width} height={height} />
        <Composition id="Desktop-Compose" component={DesktopComposeScene} durationInFrames={175} fps={fps} width={width} height={height} />
        <Composition id="Desktop-Map" component={DesktopMapScene} durationInFrames={112} fps={fps} width={width} height={height} />
        <Composition id="Desktop-Send" component={DesktopSendScene} durationInFrames={112} fps={fps} width={width} height={height} />
        <Composition id="Desktop-Closing" component={DesktopClosingScene} durationInFrames={91} fps={fps} width={width} height={height} />
      </Folder>
      <Composition id="DearFriends-Desktop-Promo-24s" component={DesktopPromo} durationInFrames={732} fps={fps} width={width} height={height} />
    </>
  )
}
