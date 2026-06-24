'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchDeckWords, saveQuizResult } from '@/lib/supabaseApi'
import Button from '@/components/Button'
import type { SavedWordDictionary, SavedWordSenseGroup } from '@/types/Dictionary'
import { BsArrowUpRightSquare, BsX } from 'react-icons/bs'
import WordPageClient from '@/components/WordPageClient'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
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

function getFirstMeaning(entry: DeckWordEntry): string {
  const d = entry.dictionary
  if (!d) return ''
  const senseGroups: SavedWordSenseGroup[] = d.senseGroups ?? []
  const jaLocales = d.locales?.ja?.senses ?? {}
  for (const group of senseGroups) {
    for (const sense of group.senses ?? []) {
      const ja = jaLocales[sense.senseId ?? ''] ?? {}
      return ja.meaning ?? sense.definition ?? ''
    }
  }
  return ''
}

type WordStatus = 'mastered' | 'review' | 'unseen'

function TriDonutChart({ mastered, review, unseen }: { mastered: number; review: number; unseen: number }) {
  const total = mastered + review + unseen
  if (total === 0) return null
  const size = 180
  const stroke = 16
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const mFrac = mastered / total
  const rFrac = review / total
  const pct = Math.round((mastered / total) * 100)

  const seg = (start: number, len: number) => ({
    strokeDasharray: `${len * circ} ${(1 - len) * circ}`,
    strokeDashoffset: -(start * circ),
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* background */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          {/* 習得済 (green) */}
          {mastered > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4ade80" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(0, mFrac).strokeDasharray}
              strokeDashoffset={seg(0, mFrac).strokeDashoffset}
            />
          )}
          {/* 要復習 (orange) */}
          {review > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fb923c" strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={seg(mFrac, rFrac).strokeDasharray}
              strokeDashoffset={seg(mFrac, rFrac).strokeDashoffset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 leading-none">{pct}<span className="text-xl font-normal text-gray-500">%</span></span>
          <span className="text-sm text-gray-400 mt-1">習得済</span>
        </div>
      </div>
      <div className="flex items-center gap-5 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
          <span className="text-gray-500">未習得 <strong className="text-gray-700">{unseen}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
          <span className="text-gray-500">要復習 <strong className="text-gray-700">{review}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          <span className="text-gray-500">習得済 <strong className="text-gray-700">{mastered}</strong></span>
        </div>
      </div>
    </div>
  )
}

function WordDetailModal({ entry, onClose }: { entry: DeckWordEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85dvh] flex flex-col shadow-xl overflow-x-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-1">
            <a href={`/word/${entry.word}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <BsArrowUpRightSquare size={24} />
            </a>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <BsX size={24} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <WordPageClient word={entry.word} dictionary={entry.dictionary} savedId={undefined} initialPinnedSenseId={null} noCard />
        </div>
      </div>
    </div>
  )
}

type QuizScope = 'random' | 'review'

export default function DeckClient({ deck }: { deck: DeckInfo }) {
  const router = useRouter()
  const [entries, setEntries] = useState<DeckWordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('random')
  const [selectedEntry, setSelectedEntry] = useState<DeckWordEntry | null>(null)

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
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
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
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-colors ${quizScope === 'random' ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white'}`}
                >
                  <p className={`font-semibold text-base ${quizScope === 'random' ? 'text-green-600' : 'text-gray-700'}`}>ランダム</p>
                  <p className={`text-xs mt-0.5 ${quizScope === 'random' ? 'text-green-500' : 'text-gray-400'}`}>{availableCount}問</p>
                </button>
                <button
                  onClick={() => setQuizScope('review')}
                  disabled={reviewWords.length === 0}
                  className={`py-3 px-4 rounded-xl border-2 text-center transition-colors disabled:opacity-40 ${quizScope === 'review' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white'}`}
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

        {/* 単語リスト */}
        <div className="space-y-0">
          {entries.map((entry, i) => {
            const meaning = getFirstMeaning(entry)
            const clickable = !!entry.dictionary
            const status = wordStatus.get(entry.word)
            return (
              <div
                key={`${entry.word}-${i}`}
                onClick={() => clickable && setSelectedEntry(entry)}
                className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${clickable ? 'cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded' : ''}`}
              >
                <span className={`font-semibold text-sm w-40 truncate ${clickable ? 'text-gray-800' : 'text-gray-300'}`}>
                  {entry.word}
                </span>
                {meaning && (
                  <span className="text-gray-400 text-xs truncate flex-1">{meaning}</span>
                )}
                {status === 'mastered' && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                {status === 'review' && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                {clickable && <span className="text-gray-300 text-base leading-none shrink-0">›</span>}
              </div>
            )
          })}
        </div>
      </div>

      {selectedEntry && <WordDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  )
}
