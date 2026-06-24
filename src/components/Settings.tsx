import { useRef, useState } from 'react'
import type { Settings } from '../data/storage'
import { speakDiagnostic } from '../speech/tts'

export function SettingsPanel({
  settings,
  onChange,
  phrases,
  onPhrasesChange,
  voices,
  onExport,
  onImport,
  onClose
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  phrases: string[]
  onPhrasesChange: (p: string[]) => void
  voices: SpeechSynthesisVoice[]
  onExport: () => void
  onImport: (data: any) => void
  onClose: () => void
}) {
  const ptVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('pt'))
  const voiceList = ptVoices.length ? ptVoices : voices
  const fileRef = useRef<HTMLInputElement>(null)
  const [diag, setDiag] = useState<string[]>([])

  const testVoice = () => {
    setDiag([])
    speakDiagnostic('Teste de voz. Um, dois, três.', settings.voiceURI, (m) =>
      setDiag((d) => [...d, m])
    )
  }

  const addPhrase = () => {
    const p = window.prompt('Nova frase rápida:')
    if (p && p.trim()) onPhrasesChange([...phrases, p.trim()])
  }
  const removePhrase = (i: number) => onPhrasesChange(phrases.filter((_, idx) => idx !== i))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        onImport(JSON.parse(String(reader.result)))
        window.alert('Configuração importada com sucesso.')
      } catch {
        window.alert('Arquivo inválido.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="settings" onClick={(e) => e.stopPropagation()}>
        <div className="settings-head">
          <h2>Ajustes</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="setting">
          <span>
            Velocidade da varredura: <b>{(settings.scanIntervalMs / 1000).toFixed(1)}s</b> por item
          </span>
          <input
            type="range"
            min={600}
            max={2500}
            step={100}
            value={settings.scanIntervalMs}
            onChange={(e) => onChange({ scanIntervalMs: Number(e.target.value) })}
          />
          <small>Menor = mais rápido</small>
        </label>

        <label className="setting">
          <span>
            Tempo de piscada para confirmar: <b>{settings.blinkHoldMs} ms</b>
          </span>
          <input
            type="range"
            min={200}
            max={1200}
            step={50}
            value={settings.blinkHoldMs}
            onChange={(e) => onChange({ blinkHoldMs: Number(e.target.value) })}
          />
          <small>Maior = evita piscadas naturais por engano</small>
        </label>

        <label className="setting">
          <span>
            Sensibilidade do olho fechado: <b>{settings.blinkThreshold.toFixed(2)}</b>
          </span>
          <input
            type="range"
            min={0.3}
            max={0.8}
            step={0.05}
            value={settings.blinkThreshold}
            onChange={(e) => onChange({ blinkThreshold: Number(e.target.value) })}
          />
          <small>Menor = detecta mais fácil</small>
        </label>

        <label className="setting row">
          <input
            type="checkbox"
            checked={settings.useCamera}
            onChange={(e) => onChange({ useCamera: e.target.checked })}
          />
          <span>Usar câmera (piscada)</span>
        </label>

        <label className="setting row">
          <input
            type="checkbox"
            checked={settings.showCamera}
            onChange={(e) => onChange({ showCamera: e.target.checked })}
          />
          <span>Mostrar preview da câmera</span>
        </label>

        <label className="setting row">
          <input
            type="checkbox"
            checked={settings.audioCue}
            onChange={(e) => onChange({ audioCue: e.target.checked })}
          />
          <span>Som ao confirmar</span>
        </label>

        <label className="setting row">
          <input
            type="checkbox"
            checked={settings.autoScroll}
            onChange={(e) => onChange({ autoScroll: e.target.checked })}
          />
          <span>Rolagem automática (seguir o seletor)</span>
        </label>

        <label className="setting">
          <span>Voz</span>
          <select
            value={settings.voiceURI ?? ''}
            onChange={(e) => onChange({ voiceURI: e.target.value || null })}
          >
            <option value="">Automática (pt-BR)</option>
            {voiceList.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {voiceList.length === 0 && <small>Nenhuma voz encontrada neste aparelho.</small>}
        </label>

        <div className="setting">
          <button className="small-btn" onClick={testVoice}>
            🔊 Testar voz
          </button>
          {diag.length > 0 && <pre className="diag">{diag.join('\n')}</pre>}
        </div>

        <div className="setting">
          <div className="phrases-head">
            <span>Frases rápidas</span>
            <button className="small-btn" onClick={addPhrase}>
              + Adicionar
            </button>
          </div>
          <ul className="phrase-list">
            {phrases.map((p, i) => (
              <li key={i}>
                <span>{p}</span>
                <button className="small-btn danger" onClick={() => removePhrase(i)}>
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="setting">
          <span>Backup das configurações</span>
          <small>
            As frases e ajustes já ficam salvos neste aparelho. Exporte um arquivo para
            não perder nada ao trocar de celular ou reinstalar.
          </small>
          <div className="backup-row">
            <button className="small-btn" onClick={onExport}>
              ⬇ Exportar
            </button>
            <button className="small-btn" onClick={() => fileRef.current?.click()}>
              ⬆ Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
