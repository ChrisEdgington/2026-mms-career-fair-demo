/**
 * Boss Battle game state. Plain data, no classes, so it's easy to extend:
 * add fields here, update them in update.ts, draw them in render.ts.
 */
export const WORLD = { width: 960, height: 540 } as const

export interface Vec {
  x: number
  y: number
}

export interface Player {
  x: number // center
  y: number // center
  width: number
  height: number
  speed: number // px/s for keyboard movement
}

export interface Bullet {
  x: number
  y: number
  radius: number
  vy: number // px/s (negative = up)
}

export interface Boss {
  x: number // center
  y: number // center
  size: number
  vx: number // px/s
  hp: number
  maxHp: number
  /** How far the boss drops every time it bounces off a wall. */
  dropPerBounce: number
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  status: GameStatus
  time: number // seconds since start
  score: number
  player: Player
  bullets: Bullet[]
  boss: Boss
  fireCooldown: number // seconds until the player can fire again
}

/** What the player wants to do this frame (from hand, keyboard, or mouse). */
export interface PlayerInput {
  /** Keyboard: -1 left, 0 none, +1 right. */
  moveX: -1 | 0 | 1
  /** Hand/mouse: desired player x in world pixels, or null if not controlling. */
  targetX: number | null
  fire: boolean
}

export const FIRE_INTERVAL = 0.22 // seconds between shots while firing

export function createInitialState(): GameState {
  return {
    status: 'playing',
    time: 0,
    score: 0,
    player: { x: WORLD.width / 2, y: WORLD.height - 50, width: 56, height: 40, speed: 520 },
    bullets: [],
    boss: { x: WORLD.width / 2, y: 90, size: 90, vx: 240, hp: 10, maxHp: 10, dropPerBounce: 22 },
    fireCooldown: 0,
  }
}
