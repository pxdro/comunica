import { useEffect, useRef, useState } from 'react'
import { Home } from './components/Home'
import { Keyboard } from './components/Keyboard'
import { CameraPanel } from './components/CameraPanel'
import { SettingsPanel } from './components/Settings'
import { OutputBar } from './components/OutputBar'
import { BlinkDetector } from './input/BlinkDetector'
import { KeyboardDetector } from './input/KeyboardDetector'
import {
  loadSettings,
  saveSettings,
  loadPhrases,
  savePhrases,
  loadLearned,
  saveLearned,
  requestPersistentStorage,
  DEFAULT_SETTINGS,
  type Settings
} from './data/storage'
import { speak, getVoices, onVoicesChanged, unlockAudio } from './speech/tts'
import type { BlinkStatus } from './core/types'

const EMPTY_STATUS: BlinkStatus = {
  ready: false,
  faceDetected: false,
  eyesClosed: false,
  holdProgress: 0
}

export default function App() {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings())
  const [phrases, setPhrasesState] = useState<string[]>(() => loadPhrases())
  const [learned, setLearnedState] = useState<Record<string, number>>(() => loadLearned())
  const [text, setText] = useState('')
  const [screen, setScreen] = useState<'home' | 'keyboard'>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [blinkStatus, setBlinkStatus] = useState<BlinkStatus>(EMPTY_STATUS)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const blinkRef = useRef<BlinkDetector | null>(null)

  const setSettings = (s: Settings) => {
    setSettingsState(s)
    saveSettings(s)
  }
  const updateSettings = (patch: Partial<Settings>) => setSettings({ ...settings, ...patch })
  const setPhrases = (p: string[]) => {
    setPhrasesState(p)
    savePhrases(p)
  }
  const setLearned = (l: Record<string, number>) => {
    setLearnedState(l)
    saveLearned(l)
  }

  const speakText = (t: string) => speak(t, settings.voiceURI)

  // Backup da configuração: baixa um JSON com frases + ajustes + palavras aprendidas.
  const exportConfig = () => {
    const data = { version: 1, settings, phrases, learned }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'comunica-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Restaura a configuração a partir de um JSON exportado antes.
  const importConfig = (data: any) => {
    if (data?.settings) {
      const s = { ...DEFAULT_SETTINGS, ...data.settings }
      setSettingsState(s)
      saveSettings(s)
    }
    if (Array.isArray(data?.phrases)) {
      setPhrasesState(data.phrases)
      savePhrases(data.phrases)
    }
    if (data?.learned && typeof data.learned === 'object') {
      setLearnedState(data.learned)
      saveLearned(data.learned)
    }
  }

  // Teclado/switch físico sempre ativo (Espaço/Enter -> confirmar).
  useEffect(() => {
    const kb = new KeyboardDetector()
    kb.start()
    return () => kb.stop()
  }, [])

  // Destrava a voz no 1º gesto do usuário (Android/iOS exigem) + pede storage persistente.
  useEffect(() => {
    requestPersistentStorage()
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // Vozes (carregam de forma assíncrona em alguns navegadores).
  useEffect(() => {
    const load = () => setVoices(getVoices())
    load()
    onVoicesChanged(load)
  }, [])

  // Câmera / piscada — liga/desliga conforme o ajuste.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!settings.useCamera) {
      blinkRef.current?.stop()
      blinkRef.current = null
      setBlinkStatus(EMPTY_STATUS)
      return
    }
    const det = new BlinkDetector({
      video,
      getConfig: () => ({
        holdMs: settingsRef.current.blinkHoldMs,
        threshold: settingsRef.current.blinkThreshold
      }),
      onStatus: setBlinkStatus
    })
    blinkRef.current = det
    det.start()
    return () => {
      det.stop()
      blinkRef.current = null
    }
  }, [settings.useCamera])

  const scanningEnabled = !settingsOpen
  const intervalMs = settings.scanIntervalMs

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn" onClick={() => setScreen('home')} title="Início">
          🏠
        </button>
        <OutputBar text={text} />
        <button className="icon-btn" onClick={() => speakText(text)} title="Falar">
          🔊
        </button>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Ajustes">
          ⚙
        </button>
      </header>

      <CameraPanel
        videoRef={videoRef}
        status={blinkStatus}
        show={settings.useCamera && settings.showCamera}
      />

      <main className="content">
        {screen === 'home' ? (
          <Home
            phrases={phrases}
            enabled={scanningEnabled}
            intervalMs={intervalMs}
            audioCue={settings.audioCue}
            autoScroll={settings.autoScroll}
            onSpeakPhrase={speakText}
            onOpenKeyboard={() => setScreen('keyboard')}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <Keyboard
            text={text}
            setText={setText}
            learned={learned}
            onLearn={setLearned}
            enabled={scanningEnabled}
            intervalMs={intervalMs}
            audioCue={settings.audioCue}
            autoScroll={settings.autoScroll}
            onSpeak={speakText}
            onBack={() => setScreen('home')}
          />
        )}
      </main>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          phrases={phrases}
          onPhrasesChange={setPhrases}
          voices={voices}
          onExport={exportConfig}
          onImport={importConfig}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
