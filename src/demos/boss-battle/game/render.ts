/**
 * Draws the game. Deliberately plain shapes: a triangle, a square, some dots.
 * Replace any of these functions to change the look without touching the rules.
 */
import { WORLD, type GameState } from './state'

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#101020'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  drawBoss(ctx, state)
  drawBullets(ctx, state)
  drawPlayer(ctx, state)
  drawHud(ctx, state)
  if (state.status !== 'playing') drawEndScreen(ctx, state)
}

function drawPlayer(ctx: CanvasRenderingContext2D, { player }: GameState) {
  ctx.fillStyle = '#22e6ff'
  ctx.beginPath()
  ctx.moveTo(player.x, player.y - player.height / 2)
  ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2)
  ctx.lineTo(player.x - player.width / 2, player.y + player.height / 2)
  ctx.closePath()
  ctx.fill()
}

function drawBullets(ctx: CanvasRenderingContext2D, { bullets }: GameState) {
  ctx.fillStyle = '#b6ff3d'
  for (const b of bullets) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, { boss }: GameState) {
  ctx.fillStyle = '#ff3d8e'
  ctx.fillRect(boss.x - boss.size / 2, boss.y - boss.size / 2, boss.size, boss.size)
  // two angry eyes
  ctx.fillStyle = '#101020'
  ctx.fillRect(boss.x - 28, boss.y - 18, 16, 16)
  ctx.fillRect(boss.x + 12, boss.y - 18, 16, 16)
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 26px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`Score: ${state.score}`, 20, 38)
  ctx.textAlign = 'right'
  ctx.fillText(`Boss HP: ${state.boss.hp} / ${state.boss.maxHp}`, WORLD.width - 20, 38)
}

function drawEndScreen(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  ctx.fillStyle = state.status === 'won' ? '#b6ff3d' : '#ff3d8e'
  ctx.font = 'black 72px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(state.status === 'won' ? 'YOU WIN!' : 'GAME OVER', WORLD.width / 2, WORLD.height / 2 - 10)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillText('Press Restart (or R) to play again', WORLD.width / 2, WORLD.height / 2 + 50)
}
