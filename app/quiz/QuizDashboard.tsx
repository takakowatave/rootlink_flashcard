'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import { colors } from '@/lib/colors'
import { HiX } from 'react-icons/hi'
import QuizScopeSelector, { type QuizScope } from '@/components/QuizScopeSelector'
import QuizStatusHelp from '@/components/QuizStatusHelp'
import { classifyQuizStatus } from '@/lib/quizScope'
import { fetchRecentQuizWords, getUserPlan } from '@/lib/supabaseApi'

const QUIZ_DASHBOARD_TUTORIAL_KEY = 'rootlink_quiz_dashboard_tutorial_v1_seen'

type MasteryStats = {
  unlearned: number
  needs_review: number     // all needs_review — for donut
  review_only: number      // needs_review AND wrong_count == 1 — for scope 「要復習」
  mastered: number
  hard: number             // wrong_count >= 2 — for scope 「苦手」
  total: number
}

type QuizMode = QuizScope

function DonutChart({ stats }: { stats: MasteryStats }) {
  const { mastered, needs_review, total } = stats
  if (total === 0) return null

  const r = 80
  const cx = 100
  const cy = 100
  const C = 2 * Math.PI * r

  const masteredLen = (mastered / total) * C
  const reviewLen = (needs_review / total) * C
  const unlearnedLen = C - masteredLen - reviewLen
  const masteredPct100 = Math.round((mastered / total) * 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="234" height="234" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="18" />
        {unlearnedLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1d5db" strokeWidth="18"
            strokeDasharray={`${unlearnedLen} ${C - unlearnedLen}`}
            strokeDashoffset={C - (masteredLen + reviewLen)} />
        )}
        {reviewLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.quizReview} strokeWidth="18"
            strokeDasharray={`${reviewLen} ${C - reviewLen}`}
            strokeDashoffset={C - masteredLen} />
        )}
        {masteredLen > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.primary} strokeWidth="18"
            strokeDasharray={`${masteredLen} ${C - masteredLen}`}
            strokeDashoffset={C} />
        )}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-gray-900">{masteredPct100}<span className="text-xl font-medium text-gray-400">%</span></span>
        <span className="text-sm text-gray-400 mt-0.5">習得済</span>
      </div>
    </div>
  )
}

// チュートリアル step5: クイズページの説明カード（スポットライトなし）
function QuizTutorialCard({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="fixed inset-0 bg-black/70 pointer-events-auto" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors" aria-label="スキップ">
            <HiX className="size-4" />
          </button>
          <div className="text-3xl text-center mb-3 select-none">🃏</div>
          <h2 className="text-base font-bold text-center text-gray-900 mb-2">クイズで定着させよう</h2>
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
            あなたが学んだ単語のストックを効率的にフラッシュカードにして学習できます。単語が溜まってきたらクイズで復習しましょう。
          </p>
          <button
            onClick={onClose}
            className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuizDashboard({ onStart, onBack, initialMode = 'all' }: { onStart: (mode: QuizMode) => void, onBack: () => void, initialMode?: QuizMode }) {
  const [stats, setStats] = useState<MasteryStats>({ unlearned: 0, needs_review: 0, review_only: 0, mastered: 0, hard: 0, total: 0 })
  const [savedTotal, setSavedTotal] = useState(0)
  const [recentCount, setRecentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<QuizMode>(initialMode)
  const [tutorialVisible, setTutorialVisible] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const plan = await getUserPlan()
      const [
        { data: savedWordRows },
        { data: savedPhraseRows },
        { data: historyRows },
        recent,
      ] = await Promise.all([
        supabase
          .from('saved_words')
          .select('words(word)')
          .eq('user_id', auth.user.id)
          .limit(5000),
        supabase
          .from('saved_phrase_cards')
          .select('phrase_cards(phrase)')
          .eq('user_id', auth.user.id)
          .limit(5000),
        supabase
          .from('quiz_results')
          .select('word')
          .eq('user_id', auth.user.id)
          .order('answered_at', { ascending: false })
          .limit(1000),
        fetchRecentQuizWords(auth.user.id, plan, 20),
      ])
      setRecentCount(recent.length)

      const savedKeys = new Set<string>()
      for (const r of (savedWordRows ?? []) as unknown as { words: { word: string } | null }[]) {
        if (r.words?.word) savedKeys.add(r.words.word)
      }
      for (const r of (savedPhraseRows ?? []) as unknown as { phrase_cards: { phrase: string } | null }[]) {
        if (r.phrase_cards?.phrase) savedKeys.add(r.phrase_cards.phrase)
      }

      // クイズ履歴のうち saved に無いもの (デッキ由来単語など) も出題母集団に含める
      const historyKeys = new Set<string>()
      for (const r of (historyRows ?? []) as { word: string }[]) {
        if (r.word && !savedKeys.has(r.word)) historyKeys.add(r.word)
      }

      const allKeys = [...savedKeys, ...historyKeys]
      setSavedTotal(allKeys.length)

      if (allKeys.length === 0) {
        setStats({ unlearned: 0, needs_review: 0, review_only: 0, mastered: 0, hard: 0, total: 0 })
        setLoading(false)
        return
      }

      const { data: qrRows } = await supabase
        .from('quiz_results')
        .select('word, correct, answered_at')
        .eq('user_id', auth.user.id)
        .in('word', allKeys)
        .order('answered_at', { ascending: false })
        .limit(10000)

      const { status, wrongCount } = classifyQuizStatus(
        (qrRows ?? []) as { word: string; correct: boolean }[],
        allKeys,
      )

      let unlearned = 0
      let needsReviewAll = 0
      let reviewOnly = 0
      let mastered = 0
      let hard = 0
      for (const k of allKeys) {
        const s = status.get(k)
        const wrong = wrongCount.get(k) ?? 0
        if (wrong >= 2) hard++
        if (s === 'mastered') mastered++
        else if (s === 'review') {
          needsReviewAll++
          if (wrong < 2) reviewOnly++
        } else {
          unlearned++
        }
      }

      setStats({ unlearned, needs_review: needsReviewAll, review_only: reviewOnly, mastered, hard, total: allKeys.length })
      setLoading(false)
    }
    load()
  }, [])

  // クイズページ初回訪問時にチュートリアルを表示
  useEffect(() => {
    if (loading) return
    if (localStorage.getItem(QUIZ_DASHBOARD_TUTORIAL_KEY)) return
    const timer = setTimeout(() => setTutorialVisible(true), 300)
    return () => clearTimeout(timer)
  }, [loading])

  const advanceTutorial = () => {
    localStorage.setItem(QUIZ_DASHBOARD_TUTORIAL_KEY, '1')
    setTutorialVisible(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
          <Button onClick={onBack} variant="secondary" size="sm">戻る</Button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (savedTotal === 0) {
    return (
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
          <Button onClick={onBack} variant="secondary" size="sm">戻る</Button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-gray-400 text-sm text-center">単語リストに単語を保存するとクイズができます</p>
        </div>
      </div>
    )
  }

  const scopeCounts: Record<QuizScope, number> = {
    all: stats.total,
    recent: recentCount,
    unseen: stats.unlearned,
    review: stats.review_only,
    hard: stats.hard,
  }

  return (
    <>
      <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
        {/* ヘッダー */}
        <header className="h-10 bg-white border-b border-line shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
          <Button onClick={onBack} variant="secondary" size="sm">戻る</Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-4 pt-6 pb-4 w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-line p-6 mb-4">

            {/* 説明 */}
            <p className="text-xs text-gray-500 text-center mb-4">
              My単語帳とデッキの単語をまとめて復習できます
            </p>

            {/* ドーナツ */}
            <div className="flex justify-center mb-4">
              <DonutChart stats={stats} />
            </div>

            {/* 統計バッジ */}
            <div className="flex justify-center gap-4 mb-8">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                <span className="text-sm text-gray-500">未習得 <strong className="text-gray-800">{stats.unlearned}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-quiz-review" />
                <span className="text-sm text-gray-500">要復習 <strong className="text-gray-800">{stats.needs_review}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-sm text-gray-500">習得済 <strong className="text-gray-800">{stats.mastered}</strong></span>
              </div>
              <QuizStatusHelp />
            </div>

            {/* モード選択タブ */}
            <p className="text-sm font-semibold text-gray-400 mb-3">出題範囲</p>
            <div className="mb-8">
              <QuizScopeSelector
                items={[
                  { key: 'recent', count: scopeCounts.recent },
                  { key: 'hard', count: scopeCounts.hard },
                  { key: 'all', count: scopeCounts.all },
                  { key: 'unseen', count: scopeCounts.unseen },
                  { key: 'review', count: scopeCounts.review },
                ]}
                selected={selectedMode}
                onChange={setSelectedMode}
              />
            </div>

            </div>{/* white card end */}

            {/* スタートボタン */}
            <Button
              onClick={() => onStart(selectedMode)}
              disabled={scopeCounts[selectedMode] === 0}
              variant="primary"
              size="lg"
              fullWidth
              data-tutorial="quiz-start"
            >
              スタート
            </Button>
          </div>
        </div>
      </div>

      {tutorialVisible && <QuizTutorialCard onClose={advanceTutorial} />}
    </>
  )
}
