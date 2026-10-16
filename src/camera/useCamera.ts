import { useEffect, useSyncExternalStore } from 'react'
import { acquireCamera, getCameraState, retryCamera, subscribeCamera, type CameraState } from './cameraManager'

/**
 * Hold the shared webcam for as long as the component is mounted.
 * Returns the camera state (idle / starting / ready / error) and a retry().
 */
export function useCamera(): { camera: CameraState; retry: () => void } {
  const camera = useSyncExternalStore(subscribeCamera, getCameraState)
  useEffect(() => acquireCamera(), [])
  return { camera, retry: retryCamera }
}
