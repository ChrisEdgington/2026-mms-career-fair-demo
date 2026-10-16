/**
 * Local MediaPipe model loading.
 *
 * All WASM + model files are served from /public (no CDN, works offline).
 * Each model is created lazily, once, and cached for the life of the page.
 * GPU delegate is tried first with a CPU fallback.
 *
 * Demos get a model through the hooks in useVisionModel.ts; don't construct
 * landmarkers directly in demo code.
 */
import {
  FaceLandmarker,
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
  PoseLandmarker,
} from '@mediapipe/tasks-vision'

/** The WASM fileset type isn't exported by the package; derive it. */
type WasmFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>

export const WASM_PATH = '/wasm'
export const MODEL_PATHS = {
  face: '/models/face_landmarker.task',
  hand: '/models/hand_landmarker.task',
  gesture: '/models/gesture_recognizer.task',
  pose: '/models/pose_landmarker_lite.task',
} as const

type Delegate = 'GPU' | 'CPU'

let filesetPromise: Promise<WasmFileset> | null = null
function getFileset(): Promise<WasmFileset> {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(WASM_PATH).catch((err) => {
      filesetPromise = null
      throw err
    })
  }
  return filesetPromise
}

const cache = new Map<string, Promise<unknown>>()

function getOrCreate<T>(key: string, create: (fileset: WasmFileset, delegate: Delegate) => Promise<T>): Promise<T> {
  const existing = cache.get(key) as Promise<T> | undefined
  if (existing) return existing
  const promise = (async () => {
    const fileset = await getFileset()
    try {
      return await create(fileset, 'GPU')
    } catch (err) {
      console.warn(`[vision] ${key}: GPU delegate failed, falling back to CPU`, err)
      return await create(fileset, 'CPU')
    }
  })()
  promise.catch(() => cache.delete(key)) // allow a retry after failure
  cache.set(key, promise)
  return promise
}

/** Face mesh (478 landmarks incl. irises) + blendshapes (smile, blink, jaw open…). */
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  return getOrCreate('face', (fileset, delegate) =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATHS.face, delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
    }),
  )
}

/** 21 hand landmarks per hand, up to 2 hands. */
export function getHandLandmarker(): Promise<HandLandmarker> {
  return getOrCreate('hand', (fileset, delegate) =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATHS.hand, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    }),
  )
}

/** Hand landmarks + canned gesture labels (Closed_Fist, Open_Palm, Victory, Pointing_Up, Thumb_Up, Thumb_Down, ILoveYou). */
export function getGestureRecognizer(): Promise<GestureRecognizer> {
  return getOrCreate('gesture', (fileset, delegate) =>
    GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATHS.gesture, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    }),
  )
}

/** 33 body landmarks (lite model = fastest). */
export function getPoseLandmarker(): Promise<PoseLandmarker> {
  return getOrCreate('pose', (fileset, delegate) =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATHS.pose, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
    }),
  )
}
