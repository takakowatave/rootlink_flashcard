'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  fetchWordlists,
  fetchSavedPhrases,
  fetchQuizEntriesByWords,
  fetchRecentQuizWords,
  getUserPlan,
  saveQuizResult,
} from '@/lib/supabaseApi'
import { classifyQuizStatus, filterKeysByScope } from '@/lib/quizScope'
import type { QuizScope } from '@/components/QuizScopeSelector'
import toast from 'react-hot-toast'
import QuizDashboard from './QuizDashboard'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import {
  fetchReviewCandidates,
  filterByPeriod,
  sortReviewCandidates,
  type ReviewPeriod,
} from '@/lib/reviewPeriod'

type QuizMode = QuizScope

export default function QuizClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasPeriodParam = ((): boolean => {
    const p = searchParams.get('period')
    return p === 'yesterday' || p === 'week' || p === 'month' || p === 'all'
  })()
  const [loading, setLoading] = useState(hasPeriodParam)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showDashboard, setShowDashboard] = useState(!hasPeriodParam)
  const [sessionEntries, setSessionEntries] = useState<QuizEntry[] | null>(null)

  useEffect(() => { toast.dismiss() }, [])

  const loadCards = useCallback(async (quizMode: QuizMode = 'all') => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }
    const userId = data.user.id

    // 「最近学習した単語」は履歴ベースで独立フロー
    if (quizMode === 'recent') {
      const plan = await getUserPlan()
      const recent = await fetchRecentQuizWords(userId, plan, 20)
      // 優先度: 誤答回数 desc → 最新解答日時 desc
      recent.sort((a, b) => {
        if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount
        return a.latestAt < b.latestAt ? 1 : -1
      })
      const top = recent.slice(0, 10)
      const entries = await fetchQuizEntriesByWords(top.map((r) => r.word))
      // 表示順のみシャッフル (slice しない)
      const cards = shuffleCards(buildQuizCards(entries))
      setSessionEntries(
        cards.map((c) => entries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }),
      )
      setLoading(false)
      setShowDashboard(false)
      return
    }

    const [wordList, phraseList] = await Promise.all([
      fetchWordlists(userId),
      fetchSavedPhrases(userId),
    ])
    const savedEntries: QuizEntry[] = [
      ...wordList.map((w) => ({
        word: w.word,
        dictionary: w.dictionary ?? null,
        pinned_sense_id: w.pinned_sense_id ?? null,
      })),
      ...phraseList.map((p) => ({
        word: p.phrase,
        dictionary: null,
        phrase_card_id: p.phrase_card_id,
        phrase_meaning_ja: p.meaning_ja,
        phrase_meaning_en: p.meaning_en,
        phrase_example_en: p.example_en,
        phrase_example_ja: p.example_ja,
        phrase_type: p.type,
      })),
    ]

    // 出題元にデッキ単語も含める: quiz_results の履歴 word から
    // saved_words に無いものだけ取得して追加
    const existingWords = new Set(savedEntries.map((e) => e.word))
    const { data: historyRows } = await supabase
      .from('quiz_results')
      .select('word')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })
      .limit(1000)
    const historyWords = [
      ...new Set(
        ((historyRows ?? []) as { word: string }[])
          .map((r) => r.word)
          .filter((w) => w && !existingWords.has(w)),
      ),
    ]
    let entries: QuizEntry[] = savedEntries
    if (historyWords.length > 0) {
      const extras = await fetchQuizEntriesByWords(historyWords)
      entries = [...savedEntries, ...extras]
    }

    if (quizMode !== 'all') {
      const keys = entries.map((e) => e.word)
      const { data: qrRows } = await supabase
        .from('quiz_results')
        .select('word, correct, answered_at')
        .eq('user_id', userId)
        .in('word', keys)
        .order('answered_at', { ascending: false })
        .limit(10000)
      const { status, wrongCount } = classifyQuizStatus(
        (qrRows ?? []) as { word: string; correct: boolean }[],
        keys,
      )
      const target = new Set(filterKeysByScope(keys, status, wrongCount, quizMode))
      entries = entries.filter((e) => target.has(e.word))
    }

    const cards = shuffleCards(buildQuizCards(entries)).slice(0, 10)
    setSessionEntries(
      cards.map((c) => entries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }),
    )
    setLoading(false)
    setShowDashboard(false)
  }, [])

  const loadPeriodQuiz = useCallback(async (period: ReviewPeriod) => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }
    const userId = data.user.id
    const plan = await getUserPlan()
    const candidates = await fetchReviewCandidates(userId, plan)
    const inPeriod = filterByPeriod(candidates, period)
    const sorted = sortReviewCandidates(inPeriod)
    const top = sorted.slice(0, 10)

    // フレーズは phrase 情報から直接 QuizEntry を組む。単語は fetchQuizEntriesByWords で dictionary を引く。
    const wordTargets = top.filter((c) => !c.phrase).map((c) => c.word)
    const wordEntries = wordTargets.length > 0 ? await fetchQuizEntriesByWords(wordTargets) : []
    const wordEntryMap = new Map(wordEntries.map((e) => [e.word, e]))

    const orderedEntries: QuizEntry[] = []
    for (const c of top) {
      if (c.phrase) {
        orderedEntries.push({
          word: c.word,
          dictionary: null,
          phrase_card_id: c.phrase.phraseCardId,
          phrase_meaning_ja: c.phrase.meaningJa,
          phrase_meaning_en: c.phrase.meaningEn,
          phrase_example_en: c.phrase.exampleEn,
          phrase_example_ja: c.phrase.exampleJa,
          phrase_type: c.phrase.type,
        })
      } else {
        const e = wordEntryMap.get(c.word)
        if (e) orderedEntries.push(e)
      }
    }

    // 表示順のみシャッフル (slice しない = 優先順位を維持)
    const cards = shuffleCards(buildQuizCards(orderedEntries))
    setSessionEntries(
      cards.map((c) => orderedEntries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }),
    )
    setLoading(false)
    setShowDashboard(false)
  }, [])

  const handleAnswer = useCallback(async (word: string, correct: boolean) => {
    saveQuizResult(word, correct)
  }, [])

  const initialMode = ((): QuizMode => {
    const m = searchParams.get('mode')
    return m === 'recent' || m === 'hard' || m === 'all' || m === 'unseen' || m === 'review' ? m : 'all'
  })()

  const initialPeriod = ((): ReviewPeriod | null => {
    const p = searchParams.get('period')
    return p === 'yesterday' || p === 'week' || p === 'month' || p === 'all' ? p : null
  })()

  useEffect(() => {
    if (initialPeriod) loadPeriodQuiz(initialPeriod)
    // 起動時1回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (showDashboard) {
    return (
      <>
        <QuizDashboard
          onStart={loadCards}
          onBack={() => router.push('/wordlist')}
          initialMode={initialMode}
        />
        {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      </>
    )
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (!sessionEntries || sessionEntries.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>保存した単語がありません</p>
        <a href="/wordlist" className="mt-4 inline-block text-primary underline text-sm">単語リストへ</a>
      </div>
    )
  }

  return (
    <QuizSession
      initialCards={shuffleCards(buildQuizCards(sessionEntries)).slice(0, 10)}
      entries={sessionEntries}
      onQuit={() => {
        if (hasPeriodParam) router.push('/')
        else setShowDashboard(true)
      }}
      onAnswer={handleAnswer}
    />
  )
}
