// Predição simples por prefixo: combina dicionário base + palavras aprendidas.
// Palavras que ele usa muito sobem no ranking.
import { BASE_WORDS } from '../data/words'

// Remove acentos para comparar o prefixo (combining diacritical marks).
const DIACRITICS = /[̀-ͯ]/g

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(DIACRITICS, '')
}

export function predict(
  prefix: string,
  learned: Record<string, number>,
  limit = 5
): string[] {
  const p = normalize(prefix.trim())
  if (!p) return []

  type Cand = { w: string; score: number }
  const cands = new Map<string, Cand>()

  // aprendidas primeiro (peso alto)
  for (const [w, count] of Object.entries(learned)) {
    if (normalize(w).startsWith(p)) {
      cands.set(w, { w, score: 100000 + count })
    }
  }
  // base do dicionário
  for (const { w, f } of BASE_WORDS) {
    if (normalize(w).startsWith(p)) {
      const ex = cands.get(w)
      if (ex) ex.score += f
      else cands.set(w, { w, score: f })
    }
  }

  return [...cands.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.w)
}

// Registra uso de uma palavra (para aprender com o tempo).
export function learnWord(
  word: string,
  learned: Record<string, number>
): Record<string, number> {
  const w = word.trim().toLowerCase()
  if (w.length < 2) return learned
  return { ...learned, [w]: (learned[w] || 0) + 1 }
}
