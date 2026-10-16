import { useEffect, useRef } from 'react'

/**
 * Runs `callback(now)` once per animation frame while `enabled` is true.
 * The callback ref is updated each render so the loop always sees fresh closures.
 */
export function useAnimationLoop(enabled: boolean, callback: (now: number) => void) {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  })

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    let running = true
    const tick = (now: number) => {
      if (!running) return
      try {
        cbRef.current(now)
      } catch (err) {
        // Keep the loop alive through a bad frame; surface it in the console.
        console.error('animation loop error', err)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(frame)
    }
  }, [enabled])
}
