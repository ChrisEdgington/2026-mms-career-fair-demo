/**
 * Rock Paper Scissors rules. Add a move here (and in gestureToMove.ts) to
 * invent a new variation.
 */
export type Move = 'rock' | 'paper' | 'scissors'
export const MOVES: Move[] = ['rock', 'paper', 'scissors']

export const MOVE_EMOJI: Record<Move, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

/** What each move beats. */
const BEATS: Record<Move, Move[]> = {
  rock: ['scissors'],
  paper: ['rock'],
  scissors: ['paper'],
}

export type Outcome = 'player' | 'computer' | 'tie'

export function decideWinner(player: Move, computer: Move): Outcome {
  if (player === computer) return 'tie'
  if (BEATS[player].includes(computer)) return 'player'
  return 'computer'
}

/**
 * The computer's move. Chosen at the START of the countdown, before the
 * player's gesture is read, so it can never cheat.
 */
export function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)]
}
