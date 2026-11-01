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
import { classifyForDonut, classifyQuizStatus, filterKeysByScope } from '@/lib/quizScope'
import type { QuizScope } from '@/components/QuizScopeSelector'
import toast from 'react-hot-toast'
import QuizDashboard from './QuizDashboard'
import ReviewDashboard, { type ReviewPeriodStats } from '@/components/ReviewDashboard'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import { fetchQuizSettings, QUIZ_SETTINGS_DEFAULTS, type QuizSettings } from '@/lib/quizSettings'
import { useAuthReload } from '@/lib/useAuthReload'
import { ensureNativeGuestSession } from '@/lib/ensureNativeGuestSession'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import {
  fetchReviewCandidates,
  filterByPeriod,
  type ReviewPeriod,
} from '@/lib/reviewPeriod'

type QuizMode = QuizScope

const EMPTY_REVIEW_STATS: ReviewPeriodStats = {
  mastered: 0, review: 0, hard: 0, unseen: 0,
  scopes: { all: 0, unseen: 0, review: 0, hard: 0 },
}

export default function QuizClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasPeriodParam = ((): boolean => {
    const p = searchParams.get('period')
    return p === 'yesterday' || p === 'week' || p === 'month' || p === 'all'
  })()
  const [loading, setLoading] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  // 復習エントリ (?period=X) で来たら ReviewDashboard を出す。クイズ中は false。
  const [reviewMode, setReviewMode] = useState<boolean>(hasPeriodParam)
  const [reviewStats, setReviewStats] = useState<ReviewPeriodStats>(EMPTY_REVIEW_STATS)
  const [reviewStatsLoaded, setReviewStatsLoaded] = useState(false)
  const [showDashboard, setShowDashboard] = useState(!hasPeriodParam)
  const [sessionEntries, setSessionEntries] = useState<QuizEntry[] | null>(null)
  const [settings, setSettings] = useState<QuizSettings>(QUIZ_SETTINGS_DEFAULTS)

  // ログイン後に settings を反映するため、SIGNED_IN でも再取得する。
  useAuthReload(async (userId, event) => {
    if (event === 'SIGNED_OUT' || !userId) {
      setSettings(QUIZ_SETTINGS_DEFAULTS)
      return
    }
    setSettings(await fetchQuizSettings(userId))
  })

  useEffect(() => { toast.dismiss() }, [])

  const initialPeriod = ((): ReviewPeriod => {
    const p = searchParams.get('period')
    return p === 'yesterday' || p === 'week' || p === 'month' || p === 'all' ? p : 'all'
  })()

  // 現在の period に対する ReviewDashboard のドーナツ・スコープ件数を取得する。
  // period が変わったら (URL 遷移で) 再計算させる。
  const loadReviewStats = useCallback(async (period: ReviewPeriod) => {
    setReviewStatsLoaded(false)
    try {
      const ok = await ensureNativeGuestSession()
      if (!ok) { setShowSignupModal(true); return }
      const { data } = await supabase.auth.getUser()
      if (!data.user) { setShowSignupModal(true); return }
      const userId = data.user.id
      const plan = await getUserPlan()
      const [candidates, qr] = await Promise.all([
        fetchReviewCandidates(userId, plan),
        supabase
          .from('quiz_results')
          .select('word, correct')
          .eq('user_id', userId)
          .order('answered_at', { ascending: false })
          .limit(10000),
      ])
      const qrRows = (qr.data ?? []) as { word: string; correct: boolean }[]
      const words = filterByPeriod(candidates, period).map((c) => c.word)
      const { status, wrongCount } = classifyQuizStatus(qrRows, words)
      const buckets = classifyForDonut(status, wrongCount, words)
      const unseenKeys = filterKeysByScope(words, status, wrongCount, 'unseen')
      const reviewKeys = filterKeysByScope(words, status, wrongCount, 'review')
      const hardKeys = filterKeysByScope(words, status, wrongCount, 'hard')
      setReviewStats({
        ...buckets,
        scopes: {
          all: words.length,
          unseen: unseenKeys.length,
          review: reviewKeys.length,
          hard: hardKeys.length,
        },
      })
    } catch (err) {
      console.error('loadReviewStats failed', err)
    } finally {
      // 失敗・早期 return でも必ずローディング解除 (そうしないと「読み込み中…」で永久固着する)。
      setReviewStatsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (hasPeriodParam) {
      void loadReviewStats(initialPeriod)
    }
    // 期間切り替え (URL の period 変化) で再計算
  }, [hasPeriodParam, initialPeriod, loadReviewStats])

  const loadCards = useCallback(async (quizMode: QuizMode = 'all') => {
    setLoading(true)
    const ok = await ensureNativeGuestSession()
    if (!ok) { setShowSignupModal(true); setLoading(false); return }
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }
    const userId = data.user.id

    // 「最近学習した単語」は履歴ベースで独立フロー
    if (quizMode === 'recent') {
      const plan = await getUserPlan()
      const recent = await fetchRecentQuizWords(userId, plan, 20)
      recent.sort((a, b) => {
        if (b.wrongCount !== a.wrongCount) return b.wrongCount - a.wrongCount
        return a.latestAt < b.latestAt ? 1 : -1
      })
      const top = recent.slice(0, settings.questionCount)
      const entries = await fetchQuizEntriesByWords(top.map((r) => r.word))
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

    const cards = shuffleCards(buildQuizCards(entries)).slice(0, settings.questionCount)
    setSessionEntries(
      cards.map((c) => entries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }),
    )
    setLoading(false)
    setShowDashboard(false)
  }, [settings.questionCount])

  // 復習エントリの「はじめる」。period で母集団を絞り、scope で状態フィルタ、ランダム N 件。
  const loadPeriodQuiz = useCallback(async (period: ReviewPeriod, scope: QuizScope) => {
    setLoading(true)
    const ok = await ensureNativeGuestSession()
    if (!ok) { setShowSignupModal(true); setLoading(false); return }
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }
    const userId = data.user.id
    const plan = await getUserPlan()
    const candidates = await fetchReviewCandidates(userId, plan)
    const inPeriod = filterByPeriod(candidates, period)
    const periodWords = inPeriod.map((c) => c.word)

    // scope で絞る (ランダム = all なら絞らない)。
    let filteredWords = periodWords
    if (scope !== 'all' && scope !== 'recent') {
      const { data: qrRows } = await supabase
        .from('quiz_results')
        .select('word, correct, answered_at')
        .eq('user_id', userId)
        .in('word', periodWords)
        .order('answered_at', { ascending: false })
        .limit(10000)
      const { status, wrongCount } = classifyQuizStatus(
        (qrRows ?? []) as { word: string; correct: boolean }[],
        periodWords,
      )
      const target = new Set(filterKeysByScope(periodWords, status, wrongCount, scope))
      filteredWords = periodWords.filter((w) => target.has(w))
    }

    // 期間 x scope の母集団からランダム N 件。優先度ソートはしない。
    const filteredCandidates = inPeriod.filter((c) => filteredWords.includes(c.word))
    const shuffled = [...filteredCandidates].sort(() => Math.random() - 0.5)
    const top = shuffled.slice(0, settings.questionCount)

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

    const cards = shuffleCards(buildQuizCards(orderedEntries))
    setSessionEntries(
      cards.map((c) => orderedEntries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }),
    )
    setLoading(false)
    setReviewMode(false)
    setShowDashboard(false)
  }, [settings.questionCount])

  const handleAnswer = useCallback(async (word: string, correct: boolean) => {
    saveQuizResult(word, correct)
  }, [])

  const initialMode = ((): QuizMode => {
    const m = searchParams.get('mode')
    return m === 'recent' || m === 'hard' || m === 'all' || m === 'unseen' || m === 'review' ? m : 'all'
  })()

  // 復習エントリ: ReviewDashboard (QuizProgressPanel ベース = 他デッキ章画面と同構造)
  if (reviewMode) {
    if (!reviewStatsLoaded) {
      return <div className="py-20 text-center text-gray-400">読み込み中...</div>
    }
    return (
      <>
        <ReviewDashboard
          period={initialPeriod}
          stats={reviewStats}
          onStart={(scope) => loadPeriodQuiz(initialPeriod, scope)}
        />
        {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      </>
    )
  }

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
      initialCards={shuffleCards(buildQuizCards(sessionEntries)).slice(0, settings.questionCount)}
      entries={sessionEntries}
      onQuit={() => {
        if (hasPeriodParam) {
          // 復習フローは入口の ReviewDashboard に戻す。stats は再計算 (回答が反映されるよう)。
          setReviewMode(true)
          void loadReviewStats(initialPeriod)
        } else {
          setShowDashboard(true)
        }
      }}
      onAnswer={handleAnswer}
      initialMode={settings.defaultMode}
      autoPlayExampleAudio={settings.autoPlayAudio}
      autoPlayHeadwordAudio={settings.autoPlayHeadword}
    />
  )
}
