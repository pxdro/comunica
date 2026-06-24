// Persistência local (localStorage). Sem backend: ajustes, frases e palavras
// aprendidas ficam só no aparelho.
import { DEFAULT_PHRASES } from './phrases'

export interface Settings {
  /** intervalo da varredura automática (ms) */
  scanIntervalMs: number
  /** tempo de olhos fechados para confirmar (ms) */
  blinkHoldMs: number
  /** limiar de "olho fechado" do MediaPipe (0..1) */
  blinkThreshold: number
  /** liga/desliga a câmera (piscada) */
  useCamera: boolean
  /** mostra o preview da câmera */
  showCamera: boolean
  /** voz selecionada (voiceURI) */
  voiceURI: string | null
  /** bip de áudio ao confirmar */
  audioCue: boolean
  /** rola a tela automaticamente para acompanhar o seletor */
  autoScroll: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  scanIntervalMs: 1300,
  blinkHoldMs: 500,
  blinkThreshold: 0.5,
  useCamera: true,
  showCamera: true,
  voiceURI: null,
  audioCue: true,
  autoScroll: true
}

const K_SETTINGS = 'comunica.settings'
const K_PHRASES = 'comunica.phrases'
const K_LEARNED = 'comunica.learned'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

export function loadSettings(): Settings {
  return read<Settings>(K_SETTINGS, DEFAULT_SETTINGS)
}
export function saveSettings(s: Settings) {
  localStorage.setItem(K_SETTINGS, JSON.stringify(s))
}

export function loadPhrases(): string[] {
  try {
    const raw = localStorage.getItem(K_PHRASES)
    if (!raw) return [...DEFAULT_PHRASES]
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : [...DEFAULT_PHRASES]
  } catch {
    return [...DEFAULT_PHRASES]
  }
}
export function savePhrases(p: string[]) {
  localStorage.setItem(K_PHRASES, JSON.stringify(p))
}

// Pede ao navegador para NÃO descartar o storage deste app (reduz o risco de o
// sistema limpar as frases/ajustes quando o armazenamento estiver baixo).
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist()
    }
  } catch {
    /* ignore */
  }
}

export function loadLearned(): Record<string, number> {
  try {
    const raw = localStorage.getItem(K_LEARNED)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
export function saveLearned(l: Record<string, number>) {
  localStorage.setItem(K_LEARNED, JSON.stringify(l))
}
