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

type QuizScope = 'random' | 'review'

export default function DeckClient({ deck }: { deck: DeckInfo }) {
  const router = useRouter()
  const [entries, setEntries] = useState<DeckWordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('random')

  const loadStatus = useCallback(async (data: DeckWordEntry[], userId: string) => {
    const words = data.map(e => e.word)
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, created_at')
      .eq('user_id', userId)
      .in('word', words)
      .order('created_at', { ascending: false })
      .limit(10000)

    const latestByWord = new Map<string, boolean>()
    for (const row of ((qr ?? []) as { word: string; correct: boolean }[])) {
      if (!latestByWord.has(row.word)) latestByWord.set(row.word, row.correct)
    }
    const statusMap = new Map<string, WordStatus>()
    for (const entry of data) {
      const latest = latestByWord.get(entry.word)
      statusMap.set(entry.word, latest === undefined ? 'unseen' : latest ? 'mastered' : 'review')
    }
    setWordStatus(statusMap)
  }, [])

  useEffect(() => {
    toast.dismiss()
    const load = async () => {
      const [data, { data: authData }] = await Promise.all([
        fetchDeckWords(deck.id),
        supabase.auth.getUser(),
      ])
      setEntries(data)
      if (authData.user && data.length > 0) await loadStatus(data, authData.user.id)
      setLoading(false)
    }
    load()
  }, [deck.id, loadStatus])

  const availableCount = entries.filter(e => !!e.dictionary).length
  const masteredCount = [...wordStatus.values()].filter(s => s === 'mastered').length
  const reviewCount = [...wordStatus.values()].filter(s => s === 'review').length
  const unseenCount = entries.length - masteredCount - reviewCount

  const reviewWords = entries.filter(e => wordStatus.get(e.word) === 'review' && !!e.dictionary)

  const startQuiz = useCallback(() => {
    const sourceEntries = quizScope === 'review' ? reviewWords : entries
    const cards = shuffleCards(buildQuizCards(sourceEntries)).slice(0, 10)
    const sessionEntries: QuizEntry[] = cards.map(c =>
      sourceEntries.find(e => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }, [entries, quizScope, reviewWords])

  const handleQuizAnswer = useCallback(async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct)
    setWordStatus(prev => new Map(prev).set(word, correct ? 'mastered' : 'review'))
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
      <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
        <Button onClick={() => router.push('/wordlist')} variant="secondary" size="sm">戻る</Button>
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuizScope('random')}
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-colors ${quizScope === 'random' ? 'border-primary bg-primary-subtle' : 'border-line bg-white'}`}
                >
                  <p className={`font-semibold text-base ${quizScope === 'random' ? 'text-green-600' : 'text-gray-700'}`}>ランダム</p>
                  <p className={`text-xs mt-0.5 ${quizScope === 'random' ? 'text-green-500' : 'text-gray-400'}`}>{availableCount}問</p>
                </button>
                <button
                  onClick={() => setQuizScope('review')}
                  disabled={reviewWords.length === 0}
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-colors disabled:opacity-40 ${quizScope === 'review' ? 'border-quiz-review bg-orange-50' : 'border-line bg-white'}`}
                >
                  <p className={`font-semibold text-base ${quizScope === 'review' ? 'text-orange-500' : 'text-gray-700'}`}>要復習</p>
                  <p className={`text-xs mt-0.5 ${quizScope === 'review' ? 'text-orange-400' : 'text-gray-400'}`}>{reviewWords.length}問</p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* クイズボタン */}
        <Button
          onClick={startQuiz}
          disabled={loading || availableCount === 0 || (quizScope === 'review' && reviewWords.length === 0)}
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
