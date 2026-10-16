import { useEffect, useState } from 'react'
import { getFaceLandmarker, getGestureRecognizer, getHandLandmarker, getPoseLandmarker } from './models'

export type ModelStatus = 'loading' | 'ready' | 'error'

export interface VisionModel<T> {
  model: T | null
  status: ModelStatus
  error: string | null
}

/** Generic: load a cached model once and expose it with a status. */
function useVisionModel<T>(load: () => Promise<T>): VisionModel<T> {
  const [state, setState] = useState<VisionModel<T>>({ model: null, status: 'loading', error: null })
  useEffect(() => {
    let cancelled = false
    load()
      .then((model) => !cancelled && setState({ model, status: 'ready', error: null }))
      .catch((err: unknown) => {
        console.error('[vision] model failed to load', err)
        if (!cancelled)
          setState({ model: null, status: 'error', error: (err as Error)?.message ?? 'Model failed to load' })
      })
    return () => {
      cancelled = true
    }
  }, [load])
  return state
}

export const useFaceLandmarker = () => useVisionModel(getFaceLandmarker)
export const useHandLandmarker = () => useVisionModel(getHandLandmarker)
export const useGestureRecognizer = () => useVisionModel(getGestureRecognizer)
export const usePoseLandmarker = () => useVisionModel(getPoseLandmarker)
