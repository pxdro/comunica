import { useEffect, useMemo, useRef, useState } from 'react'
import { useAutoScan } from '../core/useAutoScan'
import { predict, learnWord } from '../prediction/predictor'
import { beep, BEEP_GAP_MS } from '../speech/tts'

interface KItem {
  label: string
  kind: 'pred' | 'letter' | 'action'
  run: () => void
  /** texto a ser falado após o bip (opcional) */
  say?: string
}

const LETTER_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', 'Ã', 'Õ', 'Ç']
]

const NUMBER_ROWS = [
  ['0', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9']
]

export function Keyboard({
  text,
  setText,
  learned,
  onLearn,
  enabled,
  intervalMs,
  audioCue,
  autoScroll,
  onSpeak,
  onBack
}: {
  text: string
  setText: (t: string) => void
  learned: Record<string, number>
  onLearn: (l: Record<string, number>) => void
  enabled: boolean
  intervalMs: number
  audioCue: boolean
  autoScroll: boolean
  onSpeak: (t: string) => void
  onBack: () => void
}) {
  const [phase, setPhase] = useState<'row' | 'col'>('row')
  const [selectedRow, setSelectedRow] = useState(0)
  const colPassRef = useRef(0)

  const currentWord = useMemo(() => {
    const parts = text.split(' ')
    return parts[parts.length - 1] || ''
  }, [text])

  const predictions = useMemo(() => predict(currentWord, learned), [currentWord, learned])

  const appendChar = (ch: string) => setText(text + ch.toLowerCase())
  const backspace = () => setText(text.slice(0, -1))
  const clearAll = () => setText('')
  const addSpace = () => {
    if (currentWord) onLearn(learnWord(currentWord, learned))
    setText(text + ' ')
  }
  const choosePrediction = (w: string) => {
    const base = text.slice(0, text.length - currentWord.length)
    setText(base + w + ' ')
    onLearn(learnWord(w, learned))
  }

  const rows: KItem[][] = useMemo(() => {
    const r: KItem[][] = []
    if (predictions.length) {
      r.push(
        predictions.map((w) => ({
          label: w,
          kind: 'pred' as const,
          run: () => choosePrediction(w),
          say: w
        }))
      )
    }
    for (const row of LETTER_ROWS) {
      r.push(row.map((ch) => ({ label: ch, kind: 'letter' as const, run: () => appendChar(ch), say: ch })))
    }
    for (const row of NUMBER_ROWS) {
      r.push(row.map((ch) => ({ label: ch, kind: 'letter' as const, run: () => appendChar(ch), say: ch })))
    }
    r.push([
      { label: '␣ espaço', kind: 'action', run: addSpace },
      { label: '⌫ apagar', kind: 'action', run: backspace },
      { label: '🔊 falar', kind: 'action', run: () => {}, say: text },
      { label: '✕ limpar', kind: 'action', run: clearAll }
    ])
    // "voltar" sozinho, na última linha
    r.push([{ label: '↩ voltar', kind: 'action', run: onBack }])
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictions, text, learned])

  // Executa um item: bip imediato, ação imediata (UI), e a fala DEPOIS do bip.
  const fire = (item: KItem) => {
    if (audioCue) beep()
    item.run()
    if (!item.say) return
    // fala de letra/número/predição é feedback -> só com o som ligado.
    // fala da ação "falar" é função principal -> sempre.
    const isFeedback = item.kind === 'letter' || item.kind === 'pred'
    if (isFeedback && !audioCue) return
    if (audioCue) window.setTimeout(() => onSpeak(item.say!), BEEP_GAP_MS)
    else onSpeak(item.say!)
  }

  const count = phase === 'row' ? rows.length : rows[selectedRow]?.length ?? 0

  const { index } = useAutoScan({
    count,
    intervalMs,
    enabled,
    onSelect: (i) => {
      if (phase === 'row') {
        const row = rows[i]
        // linha com um item só (ex.: "voltar") -> executa direto
        if (row && row.length === 1) {
          setPhase('row')
          fire(row[0])
          return
        }
        // selecionar uma linha: só o bip e segue pra coluna
        if (audioCue) beep()
        setSelectedRow(i)
        setPhase('col')
        colPassRef.current = 0
      } else {
        const item = rows[selectedRow]?.[i]
        setPhase('row')
        if (item) fire(item)
      }
    },
    onPass: () => {
      // se varreu a linha 2x sem escolher, volta pra seleção de linhas
      if (phase === 'col') {
        colPassRef.current += 1
        if (colPassRef.current >= 2) setPhase('row')
      }
    }
  })

  const tapKey = (item: KItem) => {
    setPhase('row')
    fire(item)
  }

  // rola a linha ativa pra dentro da tela conforme a varredura desce
  const activeRowRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (autoScroll && enabled) {
      activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [index, phase, selectedRow, autoScroll, enabled])

  return (
    <div className="keyboard">
      {rows.map((row, r) => {
        const rowActive = enabled && phase === 'row' && r === index
        const rowSelected = phase === 'col' && r === selectedRow
        const isActiveRow = rowActive || rowSelected
        return (
          <div
            key={r}
            ref={isActiveRow ? activeRowRef : undefined}
            className={'kb-row' + (rowActive ? ' row-active' : '') + (rowSelected ? ' row-selected' : '')}
          >
            {row.map((it, c) => {
              const keyActive = enabled && phase === 'col' && rowSelected && c === index
              return (
                <button
                  key={c}
                  className={'kb-key kb-' + it.kind + (keyActive ? ' key-active' : '')}
                  onClick={() => tapKey(it)}
                >
                  {it.label}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
