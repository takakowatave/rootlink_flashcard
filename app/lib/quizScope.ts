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

/**
 * 進捗ドーナツ用に排他4分類を返す（合計 = keys.length）。
 * 判定順: 苦手(wrong≥2) → 習得済(latest correct) → 要復習(latest wrong) → 未習得
 */
export function classifyForDonut(
  status: Map<string, WordStatus>,
  wrongCount: Map<string, number>,
  keys: string[],
) {
  let mastered = 0
  let review = 0
  let hard = 0
  let unseen = 0
  for (const k of keys) {
    const w = wrongCount.get(k) ?? 0
    if (w >= 2) { hard++; continue }
    const s = status.get(k)
    if (s === 'mastered') mastered++
    else if (s === 'review') review++
    else unseen++
  }
  return { mastered, review, hard, unseen }
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
