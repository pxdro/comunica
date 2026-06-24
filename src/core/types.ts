// Contrato de qualquer fonte de entrada. Para adicionar um novo jeito de
// confirmar (ex.: botão USB dedicado, sopro, sensor), basta implementar isto.
export interface InputDetector {
  readonly id: string
  readonly label: string
  start(): Promise<void>
  stop(): void
}

// Status emitido pelo detector de piscada para a UI (preview da câmera).
export interface BlinkStatus {
  ready: boolean
  faceDetected: boolean
  eyesClosed: boolean
  /** 0..1 — quanto falta para confirmar enquanto os olhos ficam fechados */
  holdProgress: number
  error?: string
}
