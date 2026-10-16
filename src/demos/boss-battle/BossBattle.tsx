import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraView } from '../../camera/CameraView'
import { DemoShell } from '../../components/DemoShell'
import { StatusPill } from '../../components/StatusPill'
import { useAnimationLoop } from '../../components/useAnimationLoop'
import { createInitialState, WORLD, type GameState, type GameStatus, type PlayerInput } from './game/state'
import { update } from './game/update'
import { render } from './game/render'
import { useHandControls } from './useHandControls'

/**
 * Boss Battle: move with your hand (or arrow keys / mouse), make a fist
 * (or hold Space / click) to shoot the big pink square.
 */
export function BossBattle() {
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const handCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const stateRef = useRef<GameState>(createInitialState())
  const lastFrame = useRef<number | null>(null)
  const keys = useRef<Set<string>>(new Set())
  const mouse = useRef<{ x: number | null; down: boolean }>({ x: null, down: false })
  const [status, setStatus] = useState<GameStatus>('playing')
  const [score, setScore] = useState(0)

  const { controlRef, shape, handSeen, status: modelStatus, error } = useHandControls(videoRef, handCanvasRef)

  const restart = useCallback(() => {
    stateRef.current = createInitialState()
    lastFrame.current = null
    setStatus('playing')
    setScore(0)
  }, [])

  // Keyboard fallback: ← → / A D move, Space fires, R restarts.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current.add(e.code)
      if (e.code === 'KeyR') restart()
      if (e.code === 'Space') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.code)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [restart])

  // Game loop: gather input → update → render.
  useAnimationLoop(true, (now) => {
    const canvas = gameCanvasRef.current
    if (!canvas) return
    const dt = lastFrame.current === null ? 0 : Math.min(0.05, (now - lastFrame.current) / 1000)
    lastFrame.current = now

    const k = keys.current
    const hand = controlRef.current
    const moveX: PlayerInput['moveX'] = k.has('ArrowLeft') || k.has('KeyA') ? -1 : k.has('ArrowRight') || k.has('KeyD') ? 1 : 0
    const targetX = hand.aimX !== null ? hand.aimX * WORLD.width : mouse.current.x
    const input: PlayerInput = {
      moveX,
      targetX: moveX !== 0 ? null : targetX, // keyboard overrides hand/mouse while a key is held
      fire: hand.fire || k.has('Space') || mouse.current.down,
    }

    const state = update(stateRef.current, input, dt)
    const ctx = canvas.getContext('2d')
    if (ctx) render(ctx, state)

    if (state.status !== status) setStatus(state.status)
    if (state.score !== score) setScore(state.score)
  })

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * WORLD.width
  }

  return (
    <DemoShell
      demo="boss-battle"
      hint="Move your hand left/right to aim. Make a fist to shoot. (Or arrows + Space.)"
      status={
        <>
          {modelStatus === 'loading' && <span className="text-white/60">Loading hand model…</span>}
          {modelStatus === 'error' && <span className="text-red-300">Hand model failed: {error}</span>}
          <StatusPill
            active={handSeen}
            activeLabel={shape === 'fist' ? '✊ FIRING' : 'Hand detected'}
            idleLabel="Show me your hand…"
            color={shape === 'fist' ? '#ff3d8e' : '#a855f7'}
          />
        </>
      }
    >
      <div className="relative w-full max-w-6xl">
        <canvas
          ref={gameCanvasRef}
          width={WORLD.width}
          height={WORLD.height}
          className="w-full rounded-3xl shadow-2xl"
          style={{ aspectRatio: `${WORLD.width} / ${WORLD.height}` }}
          onMouseMove={onMouseMove}
          onMouseLeave={() => (mouse.current = { x: null, down: false })}
          onMouseDown={() => (mouse.current.down = true)}
          onMouseUp={() => (mouse.current.down = false)}
        />
        {/* Picture-in-picture hand tracking preview */}
        <div className="absolute bottom-4 right-4 w-56 overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl">
          <CameraView videoRef={videoRef} canvasRef={handCanvasRef} className="rounded-none" />
        </div>
        {status !== 'playing' && (
          <div className="absolute inset-0 flex items-end justify-center pb-16">
            <button className="btn btn-primary animate-pop text-2xl" onClick={restart}>
              ↻ Restart
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-white/60">
        <span className="font-bold text-white">Score: {score}</span>
        <button className="btn btn-secondary text-sm" onClick={restart}>
          ↻ Restart
        </button>
      </div>
    </DemoShell>
  )
}
