import { confirmBus } from '../core/confirmBus'
import type { InputDetector } from '../core/types'

// Confirma via tecla Espaço/Enter. Cobre dois casos de uma vez:
//  - teste no notebook (apertar espaço)
//  - botões/switches USB ou Bluetooth de acessibilidade, que quase sempre
//    se apresentam como teclado e enviam Espaço ou Enter.
export class KeyboardDetector implements InputDetector {
  readonly id = 'keyboard'
  readonly label = 'Tecla / botão físico (Espaço ou Enter)'
  private handler = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ') {
      e.preventDefault()
      confirmBus.emit()
    }
  }

  async start() {
    window.addEventListener('keydown', this.handler)
  }
  stop() {
    window.removeEventListener('keydown', this.handler)
  }
}
