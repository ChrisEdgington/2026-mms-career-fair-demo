import { useRef, useState } from 'react'
import { CameraView } from '../../camera/CameraView'
import { DemoShell } from '../../components/DemoShell'
import { StatusPill } from '../../components/StatusPill'
import { useAnimationLoop } from '../../components/useAnimationLoop'
import { useFaceLandmarker } from '../../vision/useVisionModel'
import { blendshapeMap, faceGeometry } from '../../vision/faceLandmarks'
import { clear } from '../../vision/draw'
import { EFFECTS, makeFaceFrame } from './effects'

/**
 * Reality Hacker: live mirrored webcam + face tracking + a couple of very
 * simple overlay effects. Effects live in effects.ts.
 */
export function RealityHacker() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const startRef = useRef(0) // set on the first frame
  const lastVideoTime = useRef(-1)
  const faceSeenRef = useRef(false)

  const { model: faceLandmarker, status, error } = useFaceLandmarker()
  const [faceDetected, setFaceDetected] = useState(false)
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(['eye-circles']))

  const toggle = (id: string) =>
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  useAnimationLoop(status === 'ready', (now) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !faceLandmarker) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    // Only run inference on new frames.
    if (video.currentTime === lastVideoTime.current) return
    lastVideoTime.current = video.currentTime
    if (startRef.current === 0) startRef.current = now

    const result = faceLandmarker.detectForVideo(video, now)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    clear(ctx)

    const landmarks = result.faceLandmarks[0]
    const seen = !!landmarks
    if (seen !== faceSeenRef.current) {
      faceSeenRef.current = seen
      setFaceDetected(seen)
    }
    if (!landmarks) return

    const frame = makeFaceFrame(
      ctx,
      landmarks,
      faceGeometry(landmarks),
      blendshapeMap(result.faceBlendshapes),
      now - startRef.current,
    )
    for (const effect of EFFECTS) {
      if (enabled.has(effect.id)) effect.draw(frame)
    }
  })

  return (
    <DemoShell
      demo="reality-hacker"
      hint="Look at the camera. The circles follow your eyes."
      status={
        <>
          {status === 'loading' && <span className="text-white/60">Loading face model…</span>}
          {status === 'error' && <span className="text-red-300">Face model failed: {error}</span>}
          <StatusPill active={faceDetected} activeLabel="Face detected" idleLabel="Looking for a face…" color="#ff3d8e" />
        </>
      }
    >
      <CameraView videoRef={videoRef} canvasRef={canvasRef} className="max-w-6xl" />
      <div className="flex flex-wrap items-center justify-center gap-3">
        {EFFECTS.map((e) => (
          <button
            key={e.id}
            className={`btn ${enabled.has(e.id) ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => toggle(e.id)}
          >
            {e.emoji} {e.name}
          </button>
        ))}
      </div>
    </DemoShell>
  )
}
