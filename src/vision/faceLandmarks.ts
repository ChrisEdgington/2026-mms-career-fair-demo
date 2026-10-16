import type { Classifications, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { centerOf, type Point } from './coords'

/**
 * Handy face-mesh landmark indices (478-point MediaPipe face model).
 * "LEFT"/"RIGHT" are the person's own left/right. In the mirrored picture the
 * person's left eye appears on the left side of the screen.
 */
export const FACE = {
  NOSE_TIP: 1,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_CHEEK: 234, // edge of face on the person's left
  RIGHT_CHEEK: 454,
  UPPER_LIP: 13,
  LOWER_LIP: 14,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  LEFT_EYE_OUTER: 263,
  LEFT_EYE_INNER: 362,
  RIGHT_EYE_OUTER: 33,
  RIGHT_EYE_INNER: 133,
  LEFT_IRIS: 473, // iris centers (refined landmarks)
  RIGHT_IRIS: 468,
  LEFT_EYE_TOP: 386,
  LEFT_EYE_BOTTOM: 374,
  RIGHT_EYE_TOP: 159,
  RIGHT_EYE_BOTTOM: 145,
} as const

/** Normalized (0..1) key points computed from the mesh. */
export interface FaceGeometry {
  leftEye: Point
  rightEye: Point
  nose: Point
  mouth: Point
  chin: Point
  forehead: Point
  /** Face width in normalized units (cheek to cheek). Useful for scaling effects. */
  width: number
  /** Face height (forehead to chin). */
  height: number
  /** Head tilt in radians (roll), from the eye line. Positive = tilted clockwise on screen. */
  roll: number
}

export function faceGeometry(lm: NormalizedLandmark[]): FaceGeometry {
  const leftEye = lm[FACE.LEFT_IRIS] ?? centerOf([lm[FACE.LEFT_EYE_OUTER], lm[FACE.LEFT_EYE_INNER]])
  const rightEye = lm[FACE.RIGHT_IRIS] ?? centerOf([lm[FACE.RIGHT_EYE_OUTER], lm[FACE.RIGHT_EYE_INNER]])
  const left = lm[FACE.LEFT_CHEEK]
  const right = lm[FACE.RIGHT_CHEEK]
  const forehead = lm[FACE.FOREHEAD]
  const chin = lm[FACE.CHIN]
  return {
    leftEye: { x: leftEye.x, y: leftEye.y },
    rightEye: { x: rightEye.x, y: rightEye.y },
    nose: { x: lm[FACE.NOSE_TIP].x, y: lm[FACE.NOSE_TIP].y },
    mouth: centerOf([lm[FACE.UPPER_LIP], lm[FACE.LOWER_LIP]]),
    chin: { x: chin.x, y: chin.y },
    forehead: { x: forehead.x, y: forehead.y },
    width: Math.hypot(left.x - right.x, left.y - right.y),
    height: Math.hypot(forehead.x - chin.x, forehead.y - chin.y),
    // In normalized space the person's right eye is at smaller x; after mirroring that flips, so negate.
    roll: -Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x),
  }
}

/**
 * Blendshapes as a simple name → 0..1 map. Useful names:
 * mouthSmileLeft / mouthSmileRight, jawOpen, eyeBlinkLeft / eyeBlinkRight,
 * browInnerUp, mouthPucker, eyeWideLeft, cheekPuff, tongueOut...
 */
export function blendshapeMap(classifications: Classifications[] | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  const cats = classifications?.[0]?.categories ?? []
  for (const c of cats) out[c.categoryName] = c.score
  return out
}

/** Convenience readings derived from blendshapes. */
export function expressions(bs: Record<string, number>) {
  return {
    smile: ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2,
    mouthOpen: bs.jawOpen ?? 0,
    leftBlink: bs.eyeBlinkLeft ?? 0,
    rightBlink: bs.eyeBlinkRight ?? 0,
    browsUp: bs.browInnerUp ?? 0,
  }
}
