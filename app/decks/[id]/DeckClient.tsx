'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchDeckWords, saveQuizResult } from '@/lib/supabaseApi'
import Button from '@/components/Button'
import type { SavedWordDictionary } from '@/types/Dictionary'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import TriDonutChart from '@/components/TriDonutChart'
import QuizScopeSelector, { type QuizScope } from '@/components/QuizScopeSelector'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import toast from 'react-hot-toast'

type DeckInfo = {
  id: string
  name: string
  label: string
  description: string | null
}

type DeckWordEntry = {
  word: string
  meaning: string | null
  dictionary: SavedWordDictionary | null
  pinned_sense_id: string | null
}

type WordStatus = 'mastered' | 'review' | 'unseen'

export default function DeckClient({ deck }: { deck: DeckInfo }) {
  const router = useRouter()
  const [entries, setEntries] = useState<DeckWordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [wrongCounts, setWrongCounts] = useState<Map<string, number>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('all')
  const [isAuthed, setIsAuthed] = useState<boolean>(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const loadStatus = useCallback(async (data: DeckWordEntry[], userId: string) => {
    const words = data.map(e => e.word)
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, answered_at')
      .eq('user_id', userId)
      .in('word', words)
      .order('answered_at', { ascending: false })
      .limit(10000)

    const latestByWord = new Map<string, boolean>()
    const wrongByWord = new Map<string, number>()
    for (const row of ((qr ?? []) as { word: string; correct: boolean }[])) {
      if (!latestByWord.has(row.word)) latestByWord.set(row.word, row.correct)
      if (!row.correct) wrongByWord.set(row.word, (wrongByWord.get(row.word) ?? 0) + 1)
    }
    const statusMap = new Map<string, WordStatus>()
    for (const entry of data) {
      const latest = latestByWord.get(entry.word)
      statusMap.set(entry.word, latest === undefined ? 'unseen' : latest ? 'mastered' : 'review')
    }
    setWordStatus(statusMap)
    setWrongCounts(wrongByWord)
  }, [])

  useEffect(() => {
    toast.dismiss()
    const load = async () => {
      const [data, { data: authData }] = await Promise.all([
        fetchDeckWords(deck.id),
        supabase.auth.getUser(),
      ])
      setEntries(data)
      setIsAuthed(!!authData.user)
      if (authData.user && data.length > 0) await loadStatus(data, authData.user.id)
      setLoading(false)
    }
    load()
  }, [deck.id, loadStatus])

  const availableEntries = entries.filter(e => !!e.dictionary)
  const availableCount = availableEntries.length
  const masteredCount = [...wordStatus.values()].filter(s => s === 'mastered').length
  const reviewCount = [...wordStatus.values()].filter(s => s === 'review').length
  const unseenCount = entries.length - masteredCount - reviewCount

  const hardWords = availableEntries.filter(e => (wrongCounts.get(e.word) ?? 0) >= 2)
  const reviewWords = availableEntries.filter(
    e => wordStatus.get(e.word) === 'review' && (wrongCounts.get(e.word) ?? 0) < 2,
  )
  const unseenWords = availableEntries.filter(e => wordStatus.get(e.word) === 'unseen')

  const scopeSource: Record<QuizScope, typeof availableEntries> = {
    all: availableEntries,
    unseen: unseenWords,
    review: reviewWords,
    hard: hardWords,
  }

  const startQuiz = useCallback(() => {
    if (!isAuthed) { setShowSignupModal(true); return }
    const sourceEntries = scopeSource[quizScope]
    const cards = shuffleCards(buildQuizCards(sourceEntries)).slice(0, 10)
    const sessionEntries: QuizEntry[] = cards.map(c =>
      sourceEntries.find(e => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }, [isAuthed, quizScope, scopeSource])

  const handleQuizAnswer = useCallback(async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct)
    setWordStatus(prev => new Map(prev).set(word, correct ? 'mastered' : 'review'))
    if (!correct) setWrongCounts(prev => new Map(prev).set(word, (prev.get(word) ?? 0) + 1))
  }, [])

  if (quizEntries !== null) {
    return (
      <QuizSession
        initialCards={shuffleCards(buildQuizCards(quizEntries)).slice(0, 10)}
        entries={quizEntries}
        onQuit={() => setQuizEntries(null)}
        onAnswer={handleQuizAnswer}
      />
    )
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
        <Button onClick={() => router.push(isAuthed ? '/wordlist' : '/')} variant="secondary" size="sm">戻る</Button>
        <h1 className="text-sm font-semibold text-gray-800 ml-3">{deck.name}</h1>
      </header>

      <div className="max-w-[700px] mx-auto w-full px-4 py-6">
        {/* デッキ情報カード */}
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm mb-6">
          <div className="mb-2">
            <span className="text-xs font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">{deck.label}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">{deck.name}</h2>
            {deck.description && <p className="text-sm text-gray-500 mt-1">{deck.description}</p>}
          </div>

          {/* ドーナツチャート */}
          {!loading && (
            <div className="flex justify-center py-4">
              <TriDonutChart mastered={masteredCount} review={reviewCount} unseen={unseenCount} />
            </div>
          )}

          {/* 出題範囲セレクター */}
          {!loading && availableCount > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-400 mb-2">出題範囲</p>
              <QuizScopeSelector
                items={[
                  { key: 'all', count: availableCount },
                  { key: 'unseen', count: unseenWords.length },
                  { key: 'review', count: reviewWords.length },
                  { key: 'hard', count: hardWords.length },
                ]}
                selected={quizScope}
                onChange={setQuizScope}
              />
            </div>
          )}
        </div>

        {/* クイズボタン */}
        <Button
          onClick={startQuiz}
          disabled={loading || scopeSource[quizScope].length === 0}
          variant="primary"
          size="lg"
          fullWidth
          className="mb-6"
        >
          {loading ? '読み込み中...' : availableCount === 0 ? '単語データがまだありません' : 'クイズを始める'}
        </Button>
      </div>
    </div>
  )
}
