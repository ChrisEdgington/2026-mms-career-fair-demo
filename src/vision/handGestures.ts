import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { distance } from './coords'

/**
 * Hand landmark indices (MediaPipe hand model, 21 points).
 * https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 */
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
} as const

export interface FingerState {
  thumb: boolean
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
}

/**
 * Which fingers are extended? A finger counts as extended when its tip is
 * clearly farther from the wrist than its middle knuckle (PIP). This works in
 * any hand orientation (sideways scissors, upside-down fist...).
 */
export function fingerStates(lm: NormalizedLandmark[]): FingerState {
  const wrist = lm[HAND.WRIST]
  const extended = (tip: number, pip: number) => distance(lm[tip], wrist) > distance(lm[pip], wrist) * 1.15
  return {
    thumb: distance(lm[HAND.THUMB_TIP], lm[HAND.PINKY_MCP]) > distance(lm[HAND.THUMB_IP], lm[HAND.PINKY_MCP]) * 1.1,
    index: extended(HAND.INDEX_TIP, HAND.INDEX_PIP),
    middle: extended(HAND.MIDDLE_TIP, HAND.MIDDLE_PIP),
    ring: extended(HAND.RING_TIP, HAND.RING_PIP),
    pinky: extended(HAND.PINKY_TIP, HAND.PINKY_PIP),
  }
}

export function countExtended(f: FingerState): number {
  return [f.index, f.middle, f.ring, f.pinky].filter(Boolean).length
}

export type HandShape = 'fist' | 'open' | 'two' | 'point' | 'other'

/**
 * Coarse hand shape from landmarks. The canned MediaPipe gesture label (if
 * any) is used when it's confident, otherwise we fall back to finger counting.
 */
export function classifyHandShape(lm: NormalizedLandmark[], cannedLabel?: string): HandShape {
  switch (cannedLabel) {
    case 'Closed_Fist':
      return 'fist'
    case 'Open_Palm':
      return 'open'
    case 'Victory':
      return 'two'
    case 'Pointing_Up':
      return 'point'
  }
  const f = fingerStates(lm)
  const n = countExtended(f)
  if (n === 0) return 'fist'
  if (n >= 4) return 'open'
  if (n === 2 && f.index && f.middle) return 'two'
  if (n === 1 && f.index) return 'point'
  return 'other'
}

/**
 * Majority-vote smoother so a reading has to hold for a few frames before it
 * changes. Prevents flicker while a hand is moving.
 */
export function createStabilizer<T extends string>(windowSize = 8, minVotes = 5) {
  const buffer: (T | null)[] = []
  let stable: T | null = null
  return {
    push(value: T | null): T | null {
      buffer.push(value)
      if (buffer.length > windowSize) buffer.shift()
      const counts = new Map<T | null, number>()
      for (const v of buffer) counts.set(v, (counts.get(v) ?? 0) + 1)
      let best: T | null = null
      let bestCount = 0
      for (const [v, c] of counts) {
        if (c > bestCount) {
          best = v
          bestCount = c
        }
      }
      if (bestCount >= minVotes) stable = best
      return stable
    },
    reset() {
      buffer.length = 0
      stable = null
    },
    get value() {
      return stable
    },
  }
}
