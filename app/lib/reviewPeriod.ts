import { supabase } from '@/lib/supabaseClient'

export type ReviewPeriod = 'yesterday' | 'week' | 'month' | 'all'
export const REVIEW_PERIODS: readonly ReviewPeriod[] = ['yesterday', 'week', 'month', 'all'] as const

export type ReviewCandidate = {
  word: string
  lastTouchedAt: string
  wrongCount: number
  source: 'saved' | 'quiz'
}

const JST = 'Asia/Tokyo'
const toJstDate = (iso: string) => new Date(iso).toLocaleDateString('sv', { timeZone: JST })
const jstToday = () => new Date().toLocaleDateString('sv', { timeZone: JST })
const jstDaysAgo = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toLocaleDateString('sv', { timeZone: JST })
}

// 3ソース (quiz_results / saved_words / saved_phrase_cards) を word 単位で統合し、
// last_touched_at・wrongCount・source を算出。plan==='free' なら quiz 由来かつ
// premium deck に含まれる word を除外。
export async function fetchReviewCandidates(
  userId: string,
  plan: 'free' | 'premium',
): Promise<ReviewCandidate[]> {
  const [qrRes, swRes, spRes] = await Promise.all([
    supabase
      .from('quiz_results')
      .select('word, correct, answered_at')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })
      .limit(5000),
    supabase
      .from('saved_words')
      .select('word, created_at')
      .eq('user_id', userId)
      .limit(5000),
    supabase
      .from('saved_phrase_cards')
      .select('created_at, phrase_cards(phrase)')
      .eq('user_id', userId)
      .limit(5000),
  ])

  const qr = ((qrRes.data ?? []) as { word: string; correct: boolean; answered_at: string }[])
    .filter((r) => r.word)
  const sw = ((swRes.data ?? []) as { word: string; created_at: string }[])
    .filter((r) => r.word)
  const sp = ((spRes.data ?? []) as unknown as {
    created_at: string
    phrase_cards: { phrase: string } | { phrase: string }[] | null
  }[])
    .map((r) => {
      const pc = Array.isArray(r.phrase_cards) ? r.phrase_cards[0] : r.phrase_cards
      return { word: pc?.phrase ?? '', created_at: r.created_at }
    })
    .filter((r) => r.word)

  const map = new Map<string, ReviewCandidate>()

  for (const r of qr) {
    const cur = map.get(r.word)
    if (cur) {
      if (r.answered_at > cur.lastTouchedAt) cur.lastTouchedAt = r.answered_at
      if (!r.correct) cur.wrongCount += 1
    } else {
      map.set(r.word, {
        word: r.word,
        lastTouchedAt: r.answered_at,
        wrongCount: r.correct ? 0 : 1,
        source: 'quiz',
      })
    }
  }

  for (const r of [...sw, ...sp]) {
    const cur = map.get(r.word)
    if (cur) {
      cur.source = 'saved'
      if (r.created_at > cur.lastTouchedAt) cur.lastTouchedAt = r.created_at
    } else {
      map.set(r.word, {
        word: r.word,
        lastTouchedAt: r.created_at,
        wrongCount: 0,
        source: 'saved',
      })
    }
  }

  let candidates = [...map.values()]

  if (plan === 'free') {
    const quizOnlyWords = candidates.filter((c) => c.source === 'quiz').map((c) => c.word)
    if (quizOnlyWords.length > 0) {
      const rows: { deck_id: string; word: string }[] = []
      for (let i = 0; i < quizOnlyWords.length; i += 200) {
        const { data } = await supabase
          .from('deck_words')
          .select('deck_id, word')
          .in('word', quizOnlyWords.slice(i, i + 200))
        if (data) rows.push(...(data as { deck_id: string; word: string }[]))
      }
      const deckIds = [...new Set(rows.map((r) => r.deck_id))]
      if (deckIds.length > 0) {
        const { data: deckMeta } = await supabase
          .from('decks')
          .select('id, is_premium')
          .in('id', deckIds)
        const premiumDecks = new Set(
          ((deckMeta ?? []) as { id: string; is_premium: boolean }[])
            .filter((d) => d.is_premium)
            .map((d) => d.id),
        )
        const excluded = new Set(
          rows.filter((r) => premiumDecks.has(r.deck_id)).map((r) => r.word),
        )
        if (excluded.size > 0) candidates = candidates.filter((c) => !excluded.has(c.word))
      }
    }
  }

  return candidates
}

// 「1週間」「1ヶ月」は今日を起点に過去N日（今日含む）。「昨日」はJST暦日で前日1日分。
export function filterByPeriod(cs: ReviewCandidate[], period: ReviewPeriod): ReviewCandidate[] {
  if (period === 'all') return cs
  const today = jstToday()
  if (period === 'yesterday') {
    const yesterday = jstDaysAgo(1)
    return cs.filter((c) => toJstDate(c.lastTouchedAt) === yesterday)
  }
  const start = period === 'week' ? jstDaysAgo(6) : jstDaysAgo(29)
  return cs.filter((c) => {
    const d = toJstDate(c.lastTouchedAt)
    return d >= start && d <= today
  })
}

// 優先度: 誤答回数desc → 同点は保存語(未出題含む)を先 → last_touched_at desc
// 「未出題・未誤答の保存語 = 誤答語の直後」→ wrong=0 グループ内で source='saved' を上位に置くと実現。
export function sortReviewCandidates(cs: ReviewCandidate[]): ReviewCandidate[] {
  return [...cs].sort((a, b) => {
    if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount
    if (a.source !== b.source) return a.source === 'saved' ? -1 : 1
    return a.lastTouchedAt < b.lastTouchedAt ? 1 : -1
  })
}
