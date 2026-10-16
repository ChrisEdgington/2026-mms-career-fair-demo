import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { useCamera } from './useCamera'

interface Props {
  /** Receives the <video> element so a demo can run inference on it. */
  videoRef: RefObject<HTMLVideoElement | null>
  /** Receives the overlay <canvas>; it is sized to the video's native pixels. */
  canvasRef?: RefObject<HTMLCanvasElement | null>
  /** Mirror the picture like a mirror (default true). Overlay drawing must mirror x too; see vision/coords.ts. */
  mirrored?: boolean
  /** Hide the raw video (overlay only). */
  hideVideo?: boolean
  className?: string
  /** Extra absolutely-positioned children drawn above the canvas (HTML overlays). */
  children?: ReactNode
}

/**
 * Live webcam picture with an overlay canvas. Handles permission / error UI.
 * The canvas has the same pixel size as the video, so normalized landmark
 * coordinates map to (x * canvas.width, y * canvas.height).
 */
export function CameraView({ videoRef, canvasRef, mirrored = true, hideVideo = false, className = '', children }: Props) {
  const { camera, retry } = useCamera()
  const [aspect, setAspect] = useState('16 / 9')

  // Attach the stream to the <video> whenever it becomes ready.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (camera.status === 'ready') {
      if (video.srcObject !== camera.stream) video.srcObject = camera.stream
      video.play().catch(() => {
        /* autoplay policies: muted video should play; ignore */
      })
    } else {
      video.srcObject = null
    }
  }, [camera, videoRef])

  const onMetadata = () => {
    const video = videoRef.current
    if (!video) return
    const w = video.videoWidth || 1280
    const h = video.videoHeight || 720
    setAspect(`${w} / ${h}`)
    if (canvasRef?.current) {
      canvasRef.current.width = w
      canvasRef.current.height = h
    }
  }

  const flip = mirrored ? 'scale-x-[-1]' : ''

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl ${className}`}
      style={{ aspectRatio: aspect }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        onLoadedMetadata={onMetadata}
        className={`absolute inset-0 h-full w-full object-contain ${flip} ${hideVideo ? 'opacity-0' : ''}`}
      />
      {canvasRef && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}
      {children}

      {camera.status !== 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 p-8 text-center">
          {camera.status === 'error' ? (
            <>
              <div className="text-6xl">📷🚫</div>
              <p className="max-w-xl text-xl font-bold text-red-200">{camera.message}</p>
              <button className="btn btn-primary" onClick={retry}>
                Retry camera
              </button>
            </>
          ) : (
            <>
              <div className="animate-pulse text-6xl">📷</div>
              <p className="text-xl font-bold text-white/80">Starting the webcam…</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
