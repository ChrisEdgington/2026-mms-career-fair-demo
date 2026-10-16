import { Route, Routes } from 'react-router-dom'
import { Landing } from '../pages/Landing'
import { Evolution } from '../pages/Evolution'
import { Presenter } from '../pages/Presenter'
import { RealityHacker } from '../demos/reality-hacker/RealityHacker'
import { BossBattle } from '../demos/boss-battle/BossBattle'
import { MotionLab } from '../demos/motion-lab/MotionLab'
import { RockPaperScissors } from '../demos/rock-paper-scissors/RockPaperScissors'
import { DemoErrorBoundary } from '../components/DemoErrorBoundary'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/evolution" element={<Evolution />} />
      <Route path="/presenter" element={<Presenter />} />
      <Route
        path="/reality-hacker"
        element={
          <DemoErrorBoundary name="Reality Hacker">
            <RealityHacker />
          </DemoErrorBoundary>
        }
      />
      <Route
        path="/boss-battle"
        element={
          <DemoErrorBoundary name="Boss Battle">
            <BossBattle />
          </DemoErrorBoundary>
        }
      />
      <Route
        path="/motion-lab"
        element={
          <DemoErrorBoundary name="Motion Lab">
            <MotionLab />
          </DemoErrorBoundary>
        }
      />
      <Route
        path="/rock-paper-scissors"
        element={
          <DemoErrorBoundary name="Rock Paper Scissors">
            <RockPaperScissors />
          </DemoErrorBoundary>
        }
      />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
