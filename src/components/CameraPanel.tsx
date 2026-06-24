import type { RefObject } from 'react'
import type { BlinkStatus } from '../core/types'

export function CameraPanel({
  videoRef,
  status,
  show
}: {
  videoRef: RefObject<HTMLVideoElement>
  status: BlinkStatus
  show: boolean
}) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - status.holdProgress)

  let label = 'Pronto — pisque com força'
  let cls = 'ok'
  if (status.error) {
    label = 'Câmera: ' + status.error
    cls = 'err'
  } else if (!status.ready) {
    label = 'Iniciando câmera…'
    cls = 'wait'
  } else if (!status.faceDetected) {
    label = 'Rosto não detectado'
    cls = 'wait'
  } else if (status.eyesClosed) {
    label = 'Segurando…'
    cls = 'hold'
  }

  return (
    <div className={'camera-panel' + (show ? '' : ' offscreen')}>
      <div className="camera-video-wrap">
        <video ref={videoRef} className="camera-video" playsInline muted />
        <svg className="hold-ring" width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} className="ring-bg" />
          <circle
            cx="36"
            cy="36"
            r={r}
            className="ring-fg"
            style={{ strokeDasharray: circ, strokeDashoffset: offset }}
          />
        </svg>
      </div>
      <div className={'camera-status ' + cls}>{label}</div>
    </div>
  )
}
