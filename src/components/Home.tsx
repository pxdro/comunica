import { useEffect, useRef } from 'react'
import { useAutoScan } from '../core/useAutoScan'
import { beep, BEEP_GAP_MS } from '../speech/tts'

interface Item {
  label: string
  kind: 'phrase' | 'nav'
  run: () => void
  say?: string
}

export function Home({
  phrases,
  enabled,
  intervalMs,
  audioCue,
  autoScroll,
  onSpeakPhrase,
  onOpenKeyboard,
  onOpenSettings
}: {
  phrases: string[]
  enabled: boolean
  intervalMs: number
  audioCue: boolean
  autoScroll: boolean
  onSpeakPhrase: (t: string) => void
  onOpenKeyboard: () => void
  onOpenSettings: () => void
}) {
  const items: Item[] = [
    { label: '⌨  Escrever', kind: 'nav', run: onOpenKeyboard },
    { label: '⚙  Ajustes', kind: 'nav', run: onOpenSettings },
    ...phrases.map((p) => ({ label: p, kind: 'phrase' as const, run: () => {}, say: p }))
  ]

  const run = (i: number) => {
    const it = items[i]
    if (!it) return
    if (audioCue) beep()
    it.run()
    if (it.say) {
      // bip primeiro, depois a voz (senão o TTS abafa o bip no Android)
      if (audioCue) window.setTimeout(() => onSpeakPhrase(it.say!), BEEP_GAP_MS)
      else onSpeakPhrase(it.say)
    }
  }

  const { index } = useAutoScan({
    count: items.length,
    intervalMs,
    enabled,
    onSelect: run
  })

  const activeRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (autoScroll && enabled) {
      activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [index, autoScroll, enabled])

  return (
    <div className="home-grid">
      {items.map((it, i) => (
        <button
          key={i}
          ref={enabled && i === index ? activeRef : undefined}
          className={
            'tile' +
            (it.kind === 'nav' ? ' tile-nav' : '') +
            (enabled && i === index ? ' active' : '')
          }
          onClick={() => run(i)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
