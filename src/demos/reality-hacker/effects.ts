/**
 * Reality Hacker effects.
 *
 * To add an effect: write a `draw(frame)` function and add it to EFFECTS.
 * `frame` gives you the canvas context, the face landmarks, key points, and
 * expression readings (smile, mouthOpen, blinks). Coordinates from
 * `frame.px(point)` are already in canvas pixels and mirrored correctly.
 *
 * Effects run every frame while a face is visible, in the order listed.
 */
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { toCanvas, type Point } from '../../vision/coords'
import { expressions, type FaceGeometry } from '../../vision/faceLandmarks'

export interface FaceFrame {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  /** All 478 face landmarks (normalized 0..1). */
  landmarks: NormalizedLandmark[]
  /** Key points: eyes, nose, mouth, chin, forehead, face width/height, roll. */
  face: FaceGeometry
  /** Blendshape scores by name (0..1). */
  blendshapes: Record<string, number>
  /** smile, mouthOpen, leftBlink, rightBlink, browsUp (0..1). */
  expr: ReturnType<typeof expressions>
  /** Milliseconds since the demo started (for animation). */
  time: number
  /** Convert a normalized point to canvas pixels (mirrored). */
  px: (p: Point) => Point
  /** Face width in canvas pixels; handy for scaling things to the head. */
  faceWidthPx: number
}

export interface Effect {
  id: string
  name: string
  emoji: string
  draw: (frame: FaceFrame) => void
}

/** Two colored circles that follow the eyes. That's it. */
const eyeCircles: Effect = {
  id: 'eye-circles',
  name: 'Eye circles',
  emoji: '👀',
  draw({ ctx, px, face, faceWidthPx }) {
    const r = faceWidthPx * 0.09
    const left = px(face.leftEye)
    const right = px(face.rightEye)
    ctx.save()
    ctx.lineWidth = 6
    ctx.strokeStyle = '#22e6ff'
    ctx.beginPath()
    ctx.arc(left.x, left.y, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#ff3d8e'
    ctx.beginPath()
    ctx.arc(right.x, right.y, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  },
}

/** A red dot on the nose. */
const noseDot: Effect = {
  id: 'nose-dot',
  name: 'Red nose',
  emoji: '🔴',
  draw({ ctx, px, face, faceWidthPx }) {
    const p = px(face.nose)
    ctx.save()
    ctx.fillStyle = '#ff2d2d'
    ctx.beginPath()
    ctx.arc(p.x, p.y, faceWidthPx * 0.08, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  },
}

export const EFFECTS: Effect[] = [eyeCircles, noseDot]

/** Build the per-frame context handed to every effect. */
export function makeFaceFrame(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  face: FaceGeometry,
  blendshapes: Record<string, number>,
  time: number,
): FaceFrame {
  const canvas = ctx.canvas
  const px = (p: Point) => toCanvas(p, canvas)
  return {
    ctx,
    canvas,
    landmarks,
    face,
    blendshapes,
    expr: expressions(blendshapes),
    time,
    px,
    faceWidthPx: face.width * canvas.width,
  }
}
