import { useRef, useState, type RefObject } from 'react'
import { GestureRecognizer } from '@mediapipe/tasks-vision'
import { useAnimationLoop } from '../../components/useAnimationLoop'
import { useGestureRecognizer } from '../../vision/useVisionModel'
import { classifyHandShape, createStabilizer, HAND, type HandShape } from '../../vision/handGestures'
import { clear, drawConnections, drawLandmarks } from '../../vision/draw'

export interface HandControl {
  /** 0..1 across the (mirrored) screen, or null when no hand. */
  aimX: number | null
  fire: boolean
  shape: HandShape | null
}

/**
 * Reads hand gestures from the webcam for Boss Battle:
 *   hand position (left/right) → aim, closed fist → fire.
 * Returns a ref (read it inside the game loop) plus React state for the HUD.
 */
export function useHandControls(videoRef: RefObject<HTMLVideoElement | null>, canvasRef: RefObject<HTMLCanvasElement | null>) {
  const { model: recognizer, status, error } = useGestureRecognizer()
  const controlRef = useRef<HandControl>({ aimX: null, fire: false, shape: null })
  const lastVideoTime = useRef(-1)
  const stabilizer = useRef(createStabilizer<HandShape>(5, 3))
  const [shape, setShape] = useState<HandShape | null>(null)
  const [handSeen, setHandSeen] = useState(false)

  useAnimationLoop(status === 'ready', (now) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !recognizer) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    if (video.currentTime === lastVideoTime.current) return
    lastVideoTime.current = video.currentTime

    const result = recognizer.recognizeForVideo(video, now)
    const landmarks = result.landmarks[0]
    const ctx = canvas?.getContext('2d')
    if (ctx) clear(ctx)

    if (!landmarks) {
      const stable = stabilizer.current.push(null)
      controlRef.current = { aimX: null, fire: false, shape: stable }
      setHandSeen((p) => (p ? false : p))
      setShape((p) => (p === stable ? p : stable))
      return
    }
    const label = result.gestures[0]?.[0]?.categoryName
    const stable = stabilizer.current.push(classifyHandShape(landmarks, label))
    const palm = landmarks[HAND.MIDDLE_MCP]
    controlRef.current = {
      aimX: 1 - palm.x, // mirrored: moving your hand right moves the player right
      fire: stable === 'fist',
      shape: stable,
    }
    setHandSeen((p) => (p ? p : true))
    setShape((p) => (p === stable ? p : stable))

    if (ctx) {
      drawConnections(ctx, landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: stable === 'fist' ? '#ff3d8e' : '#22e6ff',
        width: 5,
      })
      drawLandmarks(ctx, landmarks, { color: '#fff', radius: 6 })
    }
  })

  return { controlRef, shape, handSeen, status, error }
}
