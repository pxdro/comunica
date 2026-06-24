import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { confirmBus } from '../core/confirmBus'
import type { BlinkStatus, InputDetector } from '../core/types'

// Assets locais (copiados/baixados por `npm run setup`) — funciona offline.
const WASM_PATH = '/mediapipe/wasm'
const MODEL_PATH = '/models/face_landmarker.task'

interface BlinkConfig {
  holdMs: number
  threshold: number
}

// Detecta piscada DELIBERADA: olhos fechados de forma contínua por holdMs.
// Piscadas naturais (rápidas) não disparam. Tudo roda no aparelho; o vídeo
// nunca sai do dispositivo.
export class BlinkDetector implements InputDetector {
  readonly id = 'blink'
  readonly label = 'Piscada (câmera)'

  private video: HTMLVideoElement
  private getConfig: () => BlinkConfig
  private onStatus: (s: BlinkStatus) => void

  private landmarker: FaceLandmarker | null = null
  private stream: MediaStream | null = null
  private raf = 0
  private running = false
  private lastTs = -1
  private closeStart: number | null = null
  private fired = false

  constructor(opts: {
    video: HTMLVideoElement
    getConfig: () => BlinkConfig
    onStatus: (s: BlinkStatus) => void
  }) {
    this.video = opts.video
    this.getConfig = opts.getConfig
    this.onStatus = opts.onStatus
  }

  async start() {
    if (this.running) return
    this.running = true
    try {
      const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)
      this.landmarker = await this.createLandmarker(fileset)

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      })
      this.video.srcObject = this.stream
      this.video.muted = true
      this.video.playsInline = true
      await this.video.play()

      this.onStatus({ ready: true, faceDetected: false, eyesClosed: false, holdProgress: 0 })
      this.loop()
    } catch (e: any) {
      this.running = false
      this.onStatus({
        ready: false,
        faceDetected: false,
        eyesClosed: false,
        holdProgress: 0,
        error: e?.message || String(e)
      })
    }
  }

  // tenta GPU; cai pra CPU se não rolar
  private async createLandmarker(fileset: any): Promise<FaceLandmarker> {
    const base = {
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO' as const,
      numFaces: 1
    }
    try {
      return await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
        ...base
      })
    } catch {
      return await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'CPU' },
        ...base
      })
    }
  }

  private loop = () => {
    if (!this.running || !this.landmarker) return
    const v = this.video
    if (v.readyState >= 2 && v.videoWidth > 0) {
      let ts = performance.now()
      if (ts <= this.lastTs) ts = this.lastTs + 1
      this.lastTs = ts
      try {
        const res = this.landmarker.detectForVideo(v, ts)
        this.evaluate(res)
      } catch {
        /* frame ainda não pronto — ignora */
      }
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  private evaluate(res: any) {
    const { holdMs, threshold } = this.getConfig()
    const shapes = res?.faceBlendshapes?.[0]?.categories as
      | Array<{ categoryName: string; score: number }>
      | undefined

    if (!shapes) {
      this.closeStart = null
      this.fired = false
      this.onStatus({ ready: true, faceDetected: false, eyesClosed: false, holdProgress: 0 })
      return
    }

    const left = shapes.find((c) => c.categoryName === 'eyeBlinkLeft')?.score ?? 0
    const right = shapes.find((c) => c.categoryName === 'eyeBlinkRight')?.score ?? 0
    // exige os dois olhos fechados (evita piscar de um olho / falso positivo)
    const closed = left > threshold && right > threshold

    const now = performance.now()
    let progress = 0
    if (closed) {
      if (this.closeStart === null) this.closeStart = now
      progress = Math.min(1, (now - this.closeStart) / holdMs)
      if (now - this.closeStart >= holdMs && !this.fired) {
        this.fired = true
        confirmBus.emit()
      }
    } else {
      this.closeStart = null
      this.fired = false
    }

    this.onStatus({ ready: true, faceDetected: true, eyesClosed: closed, holdProgress: progress })
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    if (this.video) this.video.srcObject = null
    this.landmarker?.close()
    this.landmarker = null
    this.closeStart = null
    this.fired = false
    this.lastTs = -1
  }
}
