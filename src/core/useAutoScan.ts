import { useEffect, useRef, useState } from 'react'
import { confirmBus } from './confirmBus'

interface Options {
  count: number
  intervalMs: number
  enabled: boolean
  /** chamado quando o usuário confirma no item destacado */
  onSelect: (index: number) => void
  /** chamado a cada vez que a varredura completa uma volta (índice volta a 0) */
  onPass?: () => void
}

// Varredura automática: o destaque anda sozinho a cada intervalMs. Quando chega
// um "confirmar" (piscada/switch/toque) seleciona o item destacado.
export function useAutoScan({ count, intervalMs, enabled, onSelect, onPass }: Options) {
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)
  const onSelectRef = useRef(onSelect)
  const onPassRef = useRef(onPass)

  onSelectRef.current = onSelect
  onPassRef.current = onPass

  // motor que avança o destaque
  useEffect(() => {
    if (!enabled || count <= 0) return
    setIndex(0)
    indexRef.current = 0
    const id = window.setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % count
        indexRef.current = next
        if (next === 0) onPassRef.current?.()
        return next
      })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, count, intervalMs])

  // escuta o evento global de confirmação
  useEffect(() => {
    if (!enabled) return
    return confirmBus.subscribe(() => {
      onSelectRef.current(indexRef.current)
    })
  }, [enabled])

  return { index }
}
