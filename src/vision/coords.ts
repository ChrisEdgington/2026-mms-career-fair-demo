import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface Point {
  x: number
  y: number
}

/**
 * Convert a normalized landmark (0..1) into canvas pixels.
 * The camera picture is mirrored with CSS, but the canvas is NOT, so we flip x
 * here. That keeps text/images drawn on the canvas readable.
 */
export function toCanvas(lm: NormalizedLandmark | Point, canvas: HTMLCanvasElement, mirrored = true): Point {
  return {
    x: (mirrored ? 1 - lm.x : lm.x) * canvas.width,
    y: lm.y * canvas.height,
  }
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Average of several landmarks (normalized space). */
export function centerOf(points: Point[]): Point {
  const n = Math.max(1, points.length)
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  }
}
