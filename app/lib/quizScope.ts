export type WordStatus = 'mastered' | 'review' | 'unseen'
export type QuizScope = 'all' | 'unseen' | 'review' | 'hard' | 'recent'

export type QuizResultRow = {
  word: string
  correct: boolean
}

/**
 * quiz_results 行 (answered_at desc で取得済みであること) を集計して
 * word ごとの status / wrongCount を返す。
 */
export function classifyQuizStatus(rows: QuizResultRow[], keys: string[]) {
  const latestByWord = new Map<string, boolean>()
  const wrongByWord = new Map<string, number>()
  for (const row of rows) {
    if (!latestByWord.has(row.word)) latestByWord.set(row.word, row.correct)
    if (!row.correct) wrongByWord.set(row.word, (wrongByWord.get(row.word) ?? 0) + 1)
  }
  const status = new Map<string, WordStatus>()
  for (const k of keys) {
    const latest = latestByWord.get(k)
    status.set(k, latest === undefined ? 'unseen' : latest ? 'mastered' : 'review')
  }
  return { status, wrongCount: wrongByWord }
}

export function filterKeysByScope(
  keys: string[],
  status: Map<string, WordStatus>,
  wrongCount: Map<string, number>,
  scope: QuizScope,
): string[] {
  if (scope === 'all' || scope === 'recent') return keys
  if (scope === 'hard') return keys.filter((k) => (wrongCount.get(k) ?? 0) >= 2)
  if (scope === 'review') {
    return keys.filter(
      (k) => status.get(k) === 'review' && (wrongCount.get(k) ?? 0) < 2,
    )
  }
  return keys.filter((k) => status.get(k) === 'unseen')
}
