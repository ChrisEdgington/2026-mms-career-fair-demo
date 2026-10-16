import { useRef, useState } from 'react'
import { CameraView } from '../../camera/CameraView'
import { DemoShell } from '../../components/DemoShell'
import { StatusPill } from '../../components/StatusPill'
import { useAnimationLoop } from '../../components/useAnimationLoop'
import { usePoseLandmarker } from '../../vision/useVisionModel'
import { clear } from '../../vision/draw'
import { bothHandsUp, drawSkeleton, visibleCount } from './skeleton'

const NORMAL_COLOR = '#22e6ff'
const HANDS_UP_COLOR = '#ff3d8e'

/**
 * Motion Lab: mirrored webcam + body pose skeleton.
 * One tiny interaction: raise both hands above your head → skeleton turns pink.
 */
export function MotionLab() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastVideoTime = useRef(-1)
  const trackingRef = useRef(false)

  const { model: poseLandmarker, status, error } = usePoseLandmarker()
  const [tracking, setTracking] = useState(false)
  const [handsUp, setHandsUp] = useState(false)

  useAnimationLoop(status === 'ready', (now) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !poseLandmarker) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    if (video.currentTime === lastVideoTime.current) return
    lastVideoTime.current = video.currentTime

    const result = poseLandmarker.detectForVideo(video, now)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    clear(ctx)

    const landmarks = result.landmarks[0]
    const isTracking = !!landmarks && visibleCount(landmarks) >= 4
    if (isTracking !== trackingRef.current) {
      trackingRef.current = isTracking
      setTracking(isTracking)
    }
    if (!landmarks) return

    const up = bothHandsUp(landmarks)
    setHandsUp((prev) => (prev === up ? prev : up))
    drawSkeleton(ctx, landmarks, up ? HANDS_UP_COLOR : NORMAL_COLOR)
  })

  return (
    <DemoShell
      demo="motion-lab"
      hint="Step back a little. Raise both hands above your head."
      status={
        <>
          {status === 'loading' && <span className="text-white/60">Loading pose model…</span>}
          {status === 'error' && <span className="text-red-300">Pose model failed: {error}</span>}
          {handsUp && <span className="animate-pop text-2xl font-black text-[var(--accent-pink)]">🙌 HANDS UP!</span>}
          <StatusPill active={tracking} activeLabel="Tracking body" idleLabel="Looking for a person…" color="#22e6ff" />
        </>
      }
    >
      <CameraView videoRef={videoRef} canvasRef={canvasRef} className="max-w-6xl" />
    </DemoShell>
  )
}
