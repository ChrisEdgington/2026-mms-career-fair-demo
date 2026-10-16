/**
 * Shared webcam manager (singleton).
 *
 * Every demo calls `acquireCamera()` and gets the SAME MediaStream. The stream
 * is started on first acquire and stopped ~1s after the last release, so a
 * quick remount (hot reload, route switch) reuses the running camera instead
 * of re-prompting / re-initializing.
 *
 * Demo code should not touch getUserMedia directly. Use `useCamera()`.
 */

export type CameraState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'ready'; stream: MediaStream; width: number; height: number }
  | { status: 'error'; message: string }

type Listener = (state: CameraState) => void

const STOP_DELAY_MS = 1000

// Prefer smoothness over resolution; MediaPipe downsizes frames internally anyway.
const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
}

let state: CameraState = { status: 'idle' }
let stream: MediaStream | null = null
let refCount = 0
let stopTimer: ReturnType<typeof setTimeout> | null = null
let startPromise: Promise<void> | null = null
const listeners = new Set<Listener>()

function setState(next: CameraState) {
  state = next
  for (const l of listeners) l(state)
}

export function getCameraState(): CameraState {
  return state
}

export function subscribeCamera(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function describeError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera permission was denied. Click the camera icon in the address bar, allow it, then press Retry.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No webcam found. Plug one in (or check macOS Privacy settings) and press Retry.'
    case 'NotReadableError':
    case 'AbortError':
      return 'The webcam is busy in another app (Zoom, FaceTime, Photo Booth…). Close it and press Retry.'
    default:
      return `Could not start the camera: ${(err as Error)?.message ?? String(err)}`
  }
}

async function start(): Promise<void> {
  if (stream) return
  if (startPromise) return startPromise
  if (!navigator.mediaDevices?.getUserMedia) {
    setState({ status: 'error', message: 'This browser cannot access the webcam. Use Chrome, Edge, or Safari over http://localhost.' })
    return
  }
  setState({ status: 'starting' })
  startPromise = (async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
      // Nobody waited for us (released during the prompt) → stop immediately.
      if (refCount <= 0) {
        s.getTracks().forEach((t) => t.stop())
        setState({ status: 'idle' })
        return
      }
      stream = s
      const track = s.getVideoTracks()[0]
      const settings = track?.getSettings() ?? {}
      track?.addEventListener('ended', () => {
        // Camera unplugged or revoked while running.
        stream = null
        setState({ status: 'error', message: 'The camera stopped. Press Retry to reconnect.' })
      })
      setState({ status: 'ready', stream: s, width: settings.width ?? 1280, height: settings.height ?? 720 })
    } catch (err) {
      console.error('camera start failed', err)
      setState({ status: 'error', message: describeError(err) })
    } finally {
      startPromise = null
    }
  })()
  return startPromise
}

function stopNow() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  setState({ status: 'idle' })
}

function scheduleStop() {
  if (stopTimer) clearTimeout(stopTimer)
  stopTimer = setTimeout(() => {
    stopTimer = null
    if (refCount <= 0) stopNow()
  }, STOP_DELAY_MS)
}

/**
 * Ask for the shared camera. Returns a release function; call it on unmount.
 * Multiple acquirers share one stream.
 */
export function acquireCamera(): () => void {
  refCount++
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  void start()
  let released = false
  return () => {
    if (released) return
    released = true
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0) scheduleStop()
  }
}

/** After an error (permission denied, camera busy), try again. */
export function retryCamera() {
  if (state.status === 'error') {
    stopNow()
    if (refCount > 0) void start()
  }
}
