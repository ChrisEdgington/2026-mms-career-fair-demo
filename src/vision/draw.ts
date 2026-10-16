import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { toCanvas } from './coords'

interface Connection {
  start: number
  end: number
}

/** Draw lines between landmark pairs (e.g. HandLandmarker.HAND_CONNECTIONS). */
export function drawConnections(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  connections: Connection[],
  opts: { color?: string; width?: number; minVisibility?: number; mirrored?: boolean } = {},
) {
  const { color = '#22e6ff', width = 4, minVisibility = 0, mirrored = true } = opts
  const canvas = ctx.canvas
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (const { start, end } of connections) {
    const a = landmarks[start]
    const b = landmarks[end]
    if (!a || !b) continue
    if ((a.visibility ?? 1) < minVisibility || (b.visibility ?? 1) < minVisibility) continue
    const pa = toCanvas(a, canvas, mirrored)
    const pb = toCanvas(b, canvas, mirrored)
    ctx.moveTo(pa.x, pa.y)
    ctx.lineTo(pb.x, pb.y)
  }
  ctx.stroke()
  ctx.restore()
}

/** Draw a dot on each landmark. */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  opts: { color?: string; radius?: number; minVisibility?: number; mirrored?: boolean } = {},
) {
  const { color = '#ffffff', radius = 5, minVisibility = 0, mirrored = true } = opts
  const canvas = ctx.canvas
  ctx.save()
  ctx.fillStyle = color
  for (const lm of landmarks) {
    if ((lm.visibility ?? 1) < minVisibility) continue
    const p = toCanvas(lm, canvas, mirrored)
    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
}
