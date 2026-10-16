import { useCallback, useEffect, useRef, useState } from 'react'
import { GestureRecognizer } from '@mediapipe/tasks-vision'
import { CameraView } from '../../camera/CameraView'
import { DemoShell } from '../../components/DemoShell'
import { StatusPill } from '../../components/StatusPill'
import { useAnimationLoop } from '../../components/useAnimationLoop'
import { useGestureRecognizer } from '../../vision/useVisionModel'
import { classifyHandShape, createStabilizer } from '../../vision/handGestures'
import { clear, drawConnections, drawLandmarks } from '../../vision/draw'
import { shapeToMove } from './gestureToMove'
import { decideWinner, MOVE_EMOJI, MOVES, randomMove, type Move, type Outcome } from './rules'

// ---- Round state machine ----------------------------------------------------

type Phase =
  | { kind: 'idle' }
  | { kind: 'countdown'; count: number }
  | { kind: 'shoot' }
  | { kind: 'result'; player: Move | null; computer: Move; outcome: Outcome | null }

const COUNT_STEP_MS = 700
const SHOOT_WINDOW_MS = 900

interface Score {
  player: number
  computer: number
  ties: number
}

/**
 * Rock Paper Scissors against a random computer opponent, played with real
 * hand gestures (rock = fist, paper = open hand, scissors = two fingers).
 */
export function RockPaperScissors() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastVideoTime = useRef(-1)
  const stabilizer = useRef(createStabilizer<Move>(8, 5))
  const liveMoveRef = useRef<Move | null>(null)
  const handSeenRef = useRef(false)

  const { model: recognizer, status, error } = useGestureRecognizer()
  const [liveMove, setLiveMove] = useState<Move | null>(null)
  const [handSeen, setHandSeen] = useState(false)

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [score, setScore] = useState<Score>({ player: 0, computer: 0, ties: 0 })

  // Round bookkeeping that must not trigger re-renders.
  const computerMoveRef = useRef<Move>('rock') // locked in at countdown start
  const samplesRef = useRef<Move[]>([]) // gestures seen during the shoot window
  const forcedMoveRef = useRef<Move | null>(null) // clicked fallback button

  // ---- Vision loop: keep the live gesture reading fresh -------------------
  useAnimationLoop(status === 'ready', (now) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !recognizer) return
    if (video.readyState < 2 || video.videoWidth === 0) return
    if (video.currentTime === lastVideoTime.current) return
    lastVideoTime.current = video.currentTime

    const result = recognizer.recognizeForVideo(video, now)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    clear(ctx)

    const landmarks = result.landmarks[0]
    const seen = !!landmarks
    if (seen !== handSeenRef.current) {
      handSeenRef.current = seen
      setHandSeen(seen)
    }

    let raw: Move | null = null
    if (landmarks) {
      const label = result.gestures[0]?.[0]?.categoryName
      raw = shapeToMove(classifyHandShape(landmarks, label))
      drawConnections(ctx, landmarks, GestureRecognizer.HAND_CONNECTIONS, { color: '#b6ff3d', width: 4 })
      drawLandmarks(ctx, landmarks, { color: '#ffffff', radius: 6 })
    }
    const stable = stabilizer.current.push(raw)
    if (stable !== liveMoveRef.current) {
      liveMoveRef.current = stable
      setLiveMove(stable)
    }
    if (phase.kind === 'shoot' && stable) samplesRef.current.push(stable)
  })

  // ---- Round flow ---------------------------------------------------------
  const startRound = useCallback(() => {
    computerMoveRef.current = randomMove() // decided BEFORE we look at the player
    samplesRef.current = []
    forcedMoveRef.current = null
    setPhase({ kind: 'countdown', count: 3 })
  }, [])

  useEffect(() => {
    if (phase.kind === 'countdown') {
      const t = setTimeout(() => {
        setPhase(phase.count > 1 ? { kind: 'countdown', count: phase.count - 1 } : { kind: 'shoot' })
      }, COUNT_STEP_MS)
      return () => clearTimeout(t)
    }
    if (phase.kind === 'shoot') {
      const t = setTimeout(() => {
        const player = forcedMoveRef.current ?? mostCommon(samplesRef.current) ?? liveMoveRef.current
        const computer = computerMoveRef.current
        const outcome = player ? decideWinner(player, computer) : null
        if (outcome) {
          setScore((s) => ({
            player: s.player + (outcome === 'player' ? 1 : 0),
            computer: s.computer + (outcome === 'computer' ? 1 : 0),
            ties: s.ties + (outcome === 'tie' ? 1 : 0),
          }))
        }
        setPhase({ kind: 'result', player, computer, outcome })
      }, SHOOT_WINDOW_MS)
      return () => clearTimeout(t)
    }
  }, [phase])

  /** Fallback buttons: click a move instead of showing it to the camera. */
  const clickMove = (move: Move) => {
    forcedMoveRef.current = move
    if (phase.kind === 'idle' || phase.kind === 'result') {
      startRound()
      forcedMoveRef.current = move // startRound clears it; set again
    }
  }

  // Space / Enter starts a round.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        if (phase.kind === 'idle' || phase.kind === 'result') startRound()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, startRound])

  const resetScore = () => setScore({ player: 0, computer: 0, ties: 0 })

  return (
    <DemoShell
      demo="rock-paper-scissors"
      hint="Show the camera: ✊ rock, ✋ paper, ✌️ scissors"
      status={
        <>
          {status === 'loading' && <span className="text-white/60">Loading hand model…</span>}
          {status === 'error' && <span className="text-red-300">Hand model failed: {error}</span>}
          <StatusPill active={handSeen} activeLabel="Hand detected" idleLabel="Show me your hand…" color="#b6ff3d" />
        </>
      }
    >
      <div className="grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Camera with live gesture label */}
        <CameraView videoRef={videoRef} canvasRef={canvasRef}>
          <div className="absolute left-4 top-4 rounded-2xl bg-black/60 px-4 py-2 text-2xl font-black">
            I see: {liveMove ? `${MOVE_EMOJI[liveMove]} ${liveMove}` : '…'}
          </div>
          {phase.kind === 'countdown' && (
            <div key={phase.count} className="animate-pop absolute inset-0 flex items-center justify-center text-[14rem] font-black text-glow">
              {phase.count}
            </div>
          )}
          {phase.kind === 'shoot' && (
            <div className="animate-pop absolute inset-0 flex items-center justify-center text-8xl font-black text-[var(--accent-lime)] text-glow">
              SHOOT!
            </div>
          )}
        </CameraView>

        {/* Scoreboard + controls */}
        <div className="flex flex-col gap-5 rounded-3xl bg-white/5 p-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <ScoreBox label="You" value={score.player} color="#b6ff3d" />
            <ScoreBox label="Ties" value={score.ties} color="#aaaaaa" />
            <ScoreBox label="Computer" value={score.computer} color="#ff3d8e" />
          </div>

          <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl bg-black/40 p-4 text-center">
            {phase.kind === 'idle' && <p className="text-2xl font-bold text-white/80">Press PLAY, then show your move on "SHOOT!"</p>}
            {phase.kind === 'countdown' && <p className="text-3xl font-black">Get ready… {phase.count}</p>}
            {phase.kind === 'shoot' && <p className="text-3xl font-black text-[var(--accent-lime)]">SHOOT!</p>}
            {phase.kind === 'result' && <ResultView phase={phase} />}
          </div>

          <button className="btn btn-primary text-2xl" onClick={startRound} disabled={phase.kind === 'countdown' || phase.kind === 'shoot'}>
            {phase.kind === 'result' ? '▶ Play again' : '▶ Play'}
          </button>

          <div>
            <p className="mb-2 text-sm text-white/50">Camera not seeing you? Tap your move instead:</p>
            <div className="grid grid-cols-3 gap-2">
              {MOVES.map((m) => (
                <button key={m} className="btn btn-secondary text-3xl" onClick={(e) => { e.currentTarget.blur(); clickMove(m) }} aria-label={m} title={m}>
                  {MOVE_EMOJI[m]}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-secondary text-sm" onClick={resetScore}>
            Reset score
          </button>
        </div>
      </div>
    </DemoShell>
  )
}

function ScoreBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-black/40 p-3">
      <div className="text-sm font-bold uppercase tracking-wide text-white/60">{label}</div>
      <div className="text-5xl font-black" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

function ResultView({ phase }: { phase: Extract<Phase, { kind: 'result' }> }) {
  const headline =
    phase.outcome === 'player' ? '🎉 You win!' : phase.outcome === 'computer' ? '🤖 Computer wins' : phase.outcome === 'tie' ? '🤝 Tie!' : '🤔 No hand seen'
  return (
    <>
      <div className="flex items-center gap-6 text-7xl">
        <span title="you">{phase.player ? MOVE_EMOJI[phase.player] : '❓'}</span>
        <span className="text-3xl text-white/50">vs</span>
        <span title="computer">{MOVE_EMOJI[phase.computer]}</span>
      </div>
      <p className="text-3xl font-black">{headline}</p>
      {!phase.player && <p className="text-white/60">Hold your hand still in front of the camera, or tap a move.</p>}
    </>
  )
}

function mostCommon(list: Move[]): Move | null {
  if (list.length === 0) return null
  const counts = new Map<Move, number>()
  for (const m of list) counts.set(m, (counts.get(m) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
}
