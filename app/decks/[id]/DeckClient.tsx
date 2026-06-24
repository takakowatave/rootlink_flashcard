'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchDeckWords } from '@/lib/supabaseApi'
import Button from '@/components/Button'
import type { SavedWordDictionary, SavedWordSense, SavedWordSenseGroup } from '@/types/Dictionary'
import { BsVolumeUp, BsArrowUpRightSquare, BsX } from 'react-icons/bs'
import { colors } from '@/lib/colors'
import WordPageClient from '@/components/WordPageClient'
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

type QuizCard = {
  word: string
  ipa?: string
  audioPath?: string
  meaning: string
  meaningEn: string
  example?: string
  exampleJa?: string
}

type QuizMode = 'example' | 'word'

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

function buildQuizCards(entries: DeckWordEntry[]): QuizCard[] {
  const cards: QuizCard[] = []
  for (const item of entries) {
    if (!item.word) continue
    const d = item.dictionary
    if (!d) continue

    const senseGroups: SavedWordSenseGroup[] = d.senseGroups ?? []
    const jaLocales = d.locales?.ja?.senses ?? {}

    let targetSense: SavedWordSense | null = null
    outer: for (const group of senseGroups) {
      for (const sense of group.senses ?? []) {
        if (!targetSense) targetSense = sense
        break outer
      }
    }
    if (!targetSense) continue

    const senseId = targetSense.senseId ?? ''
    const ja = jaLocales[senseId] ?? {}
    const meaning = ja.meaning ?? targetSense.definition ?? ''
    if (!meaning) continue

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const audioFile = d.audio?.audioPath
      ? `${supabaseUrl}/storage/v1/object/public/${d.audio.audioPath}`
      : undefined

    cards.push({
      word: item.word,
      ipa: d.ipa ?? undefined,
      audioPath: audioFile,
      meaning,
      meaningEn: targetSense.definition ?? '',
      example: typeof targetSense.example === 'string' ? targetSense.example : undefined,
      exampleJa: ja.exampleTranslation ?? undefined,
    })
  }
  return cards
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

const SPARKLE_COLORS = [colors.primary, colors.primaryMid, colors.primaryLight, '#FFD700', '#FF9F43', '#a29bfe', '#fd79a8']

function Sparkles({ show }: { show: boolean }) {
  if (!show) return null
  const items = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 6 + Math.random() * 10,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 0.8,
  }))
  return (
    <>
      <style>{`
        @keyframes sparkle-pop {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          40% { transform: scale(1.3) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .sparkle { animation: sparkle-pop var(--dur) var(--delay) ease-in-out forwards; }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {items.map(s => (
          <div key={s.id} className="sparkle absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, color: s.color, '--dur': `${s.duration}s`, '--delay': `${s.delay}s` } as React.CSSProperties}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
          </div>
        ))}
      </div>
    </>
  )
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

function CardView({
  card, onAnswer, current, total, mode, onModeChange, onQuit,
}: {
  card: QuizCard
  onAnswer: (correct: boolean) => void
  current: number
  total: number
  mode: QuizMode
  onModeChange: (m: QuizMode) => void
  onQuit: () => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | undefined>(card.audioPath)
  const [audioLoading, setAudioLoading] = useState(false)

  useEffect(() => {
    setRevealed(false)
    setAudioUrl(card.audioPath)
    if (!card.example) onModeChange('word')
  }, [current, card.audioPath, card.example, onModeChange])

  const playAudio = async () => {
    if (audioUrl) { new Audio(audioUrl).play(); return }
    setAudioLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CLOUDRUN_API_URL}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: card.word }),
      })
      const data = await res.json()
      if (data.ok && data.audioUrl) { setAudioUrl(data.audioUrl); new Audio(data.audioUrl).play() }
    } catch { /* silent */ } finally { setAudioLoading(false) }
  }

  const renderExample = () => {
    const text = card.example
    if (!text) return null
    const regex = new RegExp(`(${card.word})`, 'gi')
    const parts = text.split(regex)
    return (
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-relaxed">
          {parts.map((part, i) =>
            part.toLowerCase() === card.word.toLowerCase()
              ? <span key={i} className="text-orange-400">{part}</span>
              : part
          )}
        </p>
        {revealed && card.exampleJa && (
          <p className="text-gray-600 text-base mt-2 leading-relaxed">{card.exampleJa}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
      <header className="h-10 bg-white border-b border-line shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <Button onClick={onQuit} variant="secondary" size="sm">終了</Button>
      </header>
      <div className="flex flex-col mx-auto w-full max-w-[700px] flex-1 min-h-0">
        <div className="h-1 mx-4 mt-4 bg-gray-100 rounded-full overflow-hidden shrink-0">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
        </div>
        <div className="flex-1 relative md:mx-4 md:mt-3 md:mb-3 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 bg-white overflow-hidden">
          <div className="p-5">
            <div className="inline-flex border border-divider rounded-[4px] overflow-hidden mb-4">
              <button onClick={() => card.example && onModeChange('example')} disabled={!card.example}
                className={`px-6 h-8 text-base font-bold transition-colors ${mode === 'example' ? 'bg-primary-light text-secondary' : !card.example ? 'bg-white text-gray-300 cursor-not-allowed' : 'bg-white text-dim'}`}>
                例文
              </button>
              <button onClick={() => onModeChange('word')}
                className={`px-6 h-8 text-base transition-colors ${mode === 'word' ? 'bg-primary-light text-secondary font-bold' : 'bg-white text-dim font-normal'}`}>
                単語
              </button>
            </div>
            {mode === 'example' && card.example ? renderExample() : (
              <div>
                <p className="text-4xl font-bold text-gray-800 tracking-wide">{card.word}</p>
                <div className="flex items-center gap-2 mt-2 h-5 text-gray-400">
                  {card.ipa && <span className="text-base">/{card.ipa}/</span>}
                  <button onClick={playAudio} disabled={audioLoading} className="p-1 hover:text-gray-600 transition-colors disabled:opacity-50">
                    {audioLoading
                      ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <BsVolumeUp size={20} />}
                  </button>
                </div>
              </div>
            )}
            {revealed && mode === 'word' && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xl font-semibold text-gray-800">{card.meaning}</p>
                {card.example && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 text-base">
                    <p className="text-gray-700 leading-relaxed">{card.example}</p>
                    {card.exampleJa && <p className="text-gray-400 mt-1.5 leading-relaxed">{card.exampleJa}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setRevealed(r => !r)}
            className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-primary text-white text-sm font-medium shadow-md hover:bg-primary-hover active:scale-95 transition-all">
            解説
          </button>
        </div>
        <div className="flex gap-3 px-4 pb-6 shrink-0">
          <Button onClick={() => onAnswer(false)} variant="secondary" size="lg" className="flex-1">わからない</Button>
          <Button onClick={() => onAnswer(true)} variant="primary" size="lg" className="flex-1">わかる</Button>
        </div>
      </div>
    </div>
  )
}

function ResultScreen({
  cards, results, entries, onRetryWrong, onBack,
}: {
  cards: QuizCard[]
  results: boolean[]
  entries: DeckWordEntry[]
  onRetryWrong: () => void
  onBack: () => void
}) {
  const correct = results.filter(Boolean).length
  const total = cards.length
  const correctCards = cards.filter((_, i) => results[i])
  const wrongCards = cards.filter((_, i) => !results[i])
  const pct = total > 0 ? correct / total : 0
  const showSparkles = pct >= 0.8
  const message = pct === 1 ? 'Perfect!' : pct >= 0.8 ? 'Fantastic!' : pct >= 0.6 ? 'Great!' : 'Keep going!'
  const [selectedEntry, setSelectedEntry] = useState<DeckWordEntry | null>(null)

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[700px] mx-auto px-4 py-8 relative">
        <Sparkles show={showSparkles} />
        <div className="relative bg-primary-subtle rounded-2xl p-6 mb-6 overflow-hidden flex flex-col items-center">
          <Sparkles show={showSparkles} />
          <p className="text-xs font-medium text-secondary bg-primary-light px-3 py-1 rounded-full mb-3">わかった数</p>
          <p className="text-5xl font-bold text-gray-900 mb-1">{correct}<span className="text-2xl text-gray-400 font-normal">/{total}</span></p>
          <p className="text-base font-bold italic text-gray-600 mt-2">{message}</p>
        </div>
        <Button onClick={onBack} variant="primary" size="lg" fullWidth className="mb-6">次へ</Button>
        {wrongCards.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-500">わからなかった（{wrongCards.length}語）</h3>
              <Button onClick={onRetryWrong} variant="secondary" size="sm"><span>↺</span> {wrongCards.length}問を復習</Button>
            </div>
            {wrongCards.map((card, i) => (
              <div key={`wrong-${card.word}-${i}`}
                onClick={() => setSelectedEntry(entries.find(e => e.word === card.word) ?? null)}
                className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
                <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
                <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
                <span className="text-gray-300 text-base leading-none">›</span>
              </div>
            ))}
          </div>
        )}
        {correctCards.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-secondary mb-2">わかった（{correctCards.length}語）</h3>
            {correctCards.map((card, i) => (
              <div key={`correct-${card.word}-${i}`}
                onClick={() => setSelectedEntry(entries.find(e => e.word === card.word) ?? null)}
                className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
                <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
                <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
                <span className="text-gray-300 text-base leading-none">›</span>
              </div>
            ))}
          </div>
        )}
        {selectedEntry && <WordDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
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
  const [quizCards, setQuizCards] = useState<QuizCard[]>([])
  const [quizActive, setQuizActive] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<QuizMode>('example')
  const [quizScope, setQuizScope] = useState<QuizScope>('random')
  const [selectedEntry, setSelectedEntry] = useState<DeckWordEntry | null>(null)

  useEffect(() => {
    toast.dismiss()
    const load = async () => {
      const [data, { data: authData }] = await Promise.all([
        fetchDeckWords(deck.id),
        supabase.auth.getUser(),
      ])
      setEntries(data)

      // クイズ履歴を取得して単語ステータスを計算
      if (authData.user && data.length > 0) {
        const words = data.map(e => e.word)
        const { data: qr } = await supabase
          .from('quiz_results')
          .select('word, correct, created_at')
          .eq('user_id', authData.user.id)
          .in('word', words)
          .order('created_at', { ascending: false })
          .limit(10000)

        const latestByWord = new Map<string, boolean>()
        for (const row of ((qr ?? []) as { word: string; correct: boolean }[])) {
          if (!latestByWord.has(row.word)) {
            latestByWord.set(row.word, row.correct)
          }
        }
        const statusMap = new Map<string, WordStatus>()
        for (const entry of data) {
          const latest = latestByWord.get(entry.word)
          if (latest === undefined) statusMap.set(entry.word, 'unseen')
          else if (latest) statusMap.set(entry.word, 'mastered')
          else statusMap.set(entry.word, 'review')
        }
        setWordStatus(statusMap)
      }
      setLoading(false)
    }
    load()
  }, [deck.id])

  const availableCount = entries.filter(e => !!e.dictionary).length
  const masteredCount = [...wordStatus.values()].filter(s => s === 'mastered').length
  const reviewCount = [...wordStatus.values()].filter(s => s === 'review').length
  const unseenCount = entries.length - masteredCount - reviewCount

  const reviewWords = entries.filter(e => wordStatus.get(e.word) === 'review' && !!e.dictionary)

  const startQuiz = useCallback(() => {
    const sourceEntries = quizScope === 'review' ? reviewWords : entries
    const built = buildQuizCards(sourceEntries)
    setQuizCards(shuffle(built).slice(0, 10))
    setCurrentIndex(0)
    setResults([])
    setDone(false)
    setMode('example')
    setQuizActive(true)
  }, [entries, quizScope, reviewWords])

  const handleAnswer = (correct: boolean) => {
    const newResults = [...results, correct]
    setResults(newResults)
    if (currentIndex + 1 >= quizCards.length) {
      setDone(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleRetryWrong = () => {
    const wrongCards = quizCards.filter((_, i) => !results[i])
    setQuizCards(shuffle(wrongCards))
    setCurrentIndex(0)
    setResults([])
    setDone(false)
  }

  const handleModeChange = useCallback((m: QuizMode) => setMode(m), [])

  if (quizActive && !done) {
    return (
      <CardView
        card={quizCards[currentIndex]}
        onAnswer={handleAnswer}
        current={currentIndex + 1}
        total={quizCards.length}
        mode={mode}
        onModeChange={handleModeChange}
        onQuit={() => setQuizActive(false)}
      />
    )
  }

  if (done) {
    return (
      <ResultScreen
        cards={quizCards}
        results={results}
        entries={entries}
        onRetryWrong={handleRetryWrong}
        onBack={() => setDone(false)}
      />
    )
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <header className="h-10 bg-white border-b border-line flex items-center px-2 shrink-0">
        <Button onClick={() => router.push('/decks')} variant="secondary" size="sm">戻る</Button>
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
