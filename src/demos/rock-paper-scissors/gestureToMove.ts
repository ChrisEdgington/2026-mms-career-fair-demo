import type { HandShape } from '../../vision/handGestures'
import type { Move } from './rules'

/** Map a coarse hand shape to a game move. */
export function shapeToMove(shape: HandShape | null): Move | null {
  switch (shape) {
    case 'fist':
      return 'rock'
    case 'open':
      return 'paper'
    case 'two':
      return 'scissors'
    default:
      return null
  }
}
