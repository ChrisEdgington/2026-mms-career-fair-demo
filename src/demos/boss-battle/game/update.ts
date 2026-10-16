/**
 * One simulation step. Pure function of (state, input, dt) → mutates state in
 * place for simplicity and returns it.
 */
import { FIRE_INTERVAL, WORLD, type GameState, type PlayerInput } from './state'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export function update(state: GameState, input: PlayerInput, dt: number): GameState {
  if (state.status !== 'playing') return state
  state.time += dt

  movePlayer(state, input, dt)
  firePlayer(state, input, dt)
  moveBullets(state, dt)
  moveBoss(state, dt)
  resolveCollisions(state)
  checkEndConditions(state)
  return state
}

function movePlayer(state: GameState, input: PlayerInput, dt: number) {
  const p = state.player
  if (input.targetX !== null) {
    // Hand / mouse control: ease toward the target so it feels smooth.
    p.x += (input.targetX - p.x) * Math.min(1, dt * 12)
  } else {
    p.x += input.moveX * p.speed * dt
  }
  p.x = clamp(p.x, p.width / 2, WORLD.width - p.width / 2)
}

function firePlayer(state: GameState, input: PlayerInput, dt: number) {
  state.fireCooldown = Math.max(0, state.fireCooldown - dt)
  if (input.fire && state.fireCooldown === 0) {
    state.bullets.push({ x: state.player.x, y: state.player.y - state.player.height / 2, radius: 7, vy: -720 })
    state.fireCooldown = FIRE_INTERVAL
  }
}

function moveBullets(state: GameState, dt: number) {
  for (const b of state.bullets) b.y += b.vy * dt
  state.bullets = state.bullets.filter((b) => b.y > -20 && b.y < WORLD.height + 20)
}

function moveBoss(state: GameState, dt: number) {
  const boss = state.boss
  boss.x += boss.vx * dt
  const half = boss.size / 2
  if (boss.x < half) {
    boss.x = half
    boss.vx = Math.abs(boss.vx)
    boss.y += boss.dropPerBounce
  } else if (boss.x > WORLD.width - half) {
    boss.x = WORLD.width - half
    boss.vx = -Math.abs(boss.vx)
    boss.y += boss.dropPerBounce
  }
}

function resolveCollisions(state: GameState) {
  const boss = state.boss
  const half = boss.size / 2
  const remaining = []
  for (const b of state.bullets) {
    const hit = b.x > boss.x - half && b.x < boss.x + half && b.y > boss.y - half && b.y < boss.y + half
    if (hit) {
      boss.hp -= 1
      state.score += 10
    } else {
      remaining.push(b)
    }
  }
  state.bullets = remaining
}

function checkEndConditions(state: GameState) {
  const { boss, player } = state
  if (boss.hp <= 0) {
    state.status = 'won'
    return
  }
  const bossBottom = boss.y + boss.size / 2
  const touchingPlayer =
    bossBottom >= player.y - player.height / 2 && Math.abs(boss.x - player.x) < boss.size / 2 + player.width / 2
  if (bossBottom >= WORLD.height || touchingPlayer) {
    state.status = 'lost'
  }
}
