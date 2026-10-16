/**
 * Motion Lab drawing + simple body helpers.
 * Pose landmark indices: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
import { PoseLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { drawConnections, drawLandmarks } from '../../vision/draw'

export const POSE = {
  NOSE: 0,
  LEFT_EYE: 2, RIGHT_EYE: 5,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
} as const

/** Landmarks below this visibility are treated as "not in the picture". */
export const MIN_VISIBILITY = 0.5

export function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], color: string) {
  // Skip the face-mesh-like lines on the head (indices < 11) — they're noisy and tiny.
  const bodyConnections = PoseLandmarker.POSE_CONNECTIONS.filter((c) => c.start >= 11 && c.end >= 11)
  drawConnections(ctx, landmarks, bodyConnections, { color, width: 6, minVisibility: MIN_VISIBILITY })
  drawLandmarks(ctx, landmarks.slice(11), { color: '#ffffff', radius: 7, minVisibility: MIN_VISIBILITY })
  // Head: one circle at the nose.
  const nose = landmarks[POSE.NOSE]
  if (nose && (nose.visibility ?? 1) >= MIN_VISIBILITY) {
    drawLandmarks(ctx, [nose], { color, radius: 18 })
  }
}

/** How many of the 33 landmarks are confidently visible. */
export function visibleCount(landmarks: NormalizedLandmark[]): number {
  return landmarks.filter((l) => (l.visibility ?? 1) >= MIN_VISIBILITY).length
}

/** True when both wrists are above the nose (y is smaller = higher on screen). */
export function bothHandsUp(lm: NormalizedLandmark[]): boolean {
  const nose = lm[POSE.NOSE]
  const lw = lm[POSE.LEFT_WRIST]
  const rw = lm[POSE.RIGHT_WRIST]
  if (!nose || !lw || !rw) return false
  const vis = (l: NormalizedLandmark) => (l.visibility ?? 1) >= MIN_VISIBILITY
  return vis(lw) && vis(rw) && lw.y < nose.y && rw.y < nose.y
}
