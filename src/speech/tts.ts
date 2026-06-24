// Voz via Web Speech API. No Android/Chrome há vozes pt-BR nativas.
let cachedVoices: SpeechSynthesisVoice[] = []

export function getVoices(): SpeechSynthesisVoice[] {
  cachedVoices = window.speechSynthesis?.getVoices?.() ?? []
  return cachedVoices
}

export function onVoicesChanged(cb: () => void) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.onvoiceschanged = cb
}

export function getPtVoices(): SpeechSynthesisVoice[] {
  return getVoices().filter((v) => v.lang?.toLowerCase().startsWith('pt'))
}

function pickVoice(voiceURI: string | null): SpeechSynthesisVoice | undefined {
  const voices = getVoices()
  if (voiceURI) {
    const found = voices.find((v) => v.voiceURI === voiceURI)
    if (found) return found
  }
  // preferência: pt-BR > pt-* > padrão do sistema
  return (
    voices.find((v) => v.lang?.toLowerCase() === 'pt-br') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('pt'))
  )
}

export function speak(text: string, voiceURI: string | null) {
  if (!text.trim() || !('speechSynthesis' in window)) return
  // Android às vezes deixa a síntese "pausada" — destrava antes de falar.
  window.speechSynthesis.resume()
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice(voiceURI)
  if (v) u.voice = v
  u.lang = v?.lang || 'pt-BR'
  u.rate = 1
  u.pitch = 1
  window.speechSynthesis.speak(u)
}

// Fala de teste com diagnóstico — reporta cada etapa para a UI, pra entender
// por que a voz não sai em alguns aparelhos.
export function speakDiagnostic(
  text: string,
  voiceURI: string | null,
  report: (msg: string) => void
) {
  if (!('speechSynthesis' in window)) {
    report('Este navegador NÃO tem speechSynthesis.')
    return
  }
  const voices = getVoices()
  const pt = voices.filter((v) => v.lang?.toLowerCase().startsWith('pt'))
  report(`Vozes no aparelho: ${voices.length}`)
  report(`Vozes pt: ${pt.length ? pt.map((v) => `${v.name} (${v.lang})`).join(', ') : 'NENHUMA'}`)

  try {
    window.speechSynthesis.resume()
    window.speechSynthesis.cancel()
  } catch {
    /* ignore */
  }

  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice(voiceURI)
  u.voice = v ?? null
  u.lang = v?.lang || 'pt-BR'
  report(`Tentando falar com: ${v ? v.name : '(voz padrão do sistema)'} / lang=${u.lang}`)
  u.onstart = () => report('▶ começou (onstart) — deveria estar saindo som agora')
  u.onend = () => report('✔ terminou (onend)')
  u.onerror = (e: any) => report('✖ erro: ' + (e?.error || 'desconhecido'))
  window.speechSynthesis.speak(u)

  window.setTimeout(() => {
    if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
      report('… nada iniciou em 1,2s. Provável: falta de voz/engine de TTS no aparelho.')
    }
  }, 1200)
}

// --- Áudio / desbloqueio para mobile ---
let audioCtx: AudioContext | null = null
let unlocked = false

function getAudioCtx(): AudioContext | null {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)()
    return audioCtx
  } catch {
    return null
  }
}

// Deve ser chamado DENTRO de um gesto do usuário (toque/tecla). Destrava tanto
// o WebAudio (bip) quanto a fala (speechSynthesis) no Android/iOS, que exigem
// uma primeira interação. Depois disso, falas disparadas por piscada saem normal.
export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  const ctx = getAudioCtx()
  ctx?.resume?.()
  try {
    window.speechSynthesis.resume()
    // Fala um espaço em volume normal (silencioso na prática, mas conta como
    // fala "de verdade" dentro do gesto — é isso que destrava o TTS no Android).
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 1
    window.speechSynthesis.speak(u)
  } catch {
    /* ignore */
  }
}

export function isAudioUnlocked() {
  return unlocked
}

// Intervalo entre o bip e a fala: tempo do bip terminar antes do TTS começar
// (no Android o TTS abafa o WebAudio se tocarem juntos).
export const BEEP_GAP_MS = 220

// Bip curto de confirmação (WebAudio) — feedback sonoro a cada seleção.
export function beep() {
  const ctx = getAudioCtx()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
  } catch {
    /* ignore */
  }
}
