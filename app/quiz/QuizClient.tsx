'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchWordlists } from '@/lib/supabaseApi'
import { BsVolumeUp } from 'react-icons/bs'
import toast from 'react-hot-toast'

type QuizCard = {
  word: string
  ipa?: string
  audioPath?: string
  meaning: string       // JA（ピン留め意味）
  meaningEn: string     // EN
  example?: string      // EN例文
  exampleJa?: string    // JA例文訳
}

function buildQuizCards(wordList: any[]): QuizCard[] {
  const cards: QuizCard[] = []

  for (const item of wordList) {
    const d = item.dictionary
    if (!d) continue

    const senseGroups: any[] = d.senseGroups ?? []
    const jaLocales: Record<string, any> = d.locales?.ja?.senses ?? {}
    const pinnedSenseId: string | null = item.pinned_sense_id ?? null

    // ピン留めされた sense を探す（なければ最初の sense）
    let targetSense: any = null
    outer: for (const group of senseGroups) {
      for (const sense of group.senses ?? []) {
        if (!targetSense) targetSense = sense
        if (sense.senseId === pinnedSenseId) {
          targetSense = sense
          break outer
        }
      }
    }

    if (!targetSense) continue

    const ja = jaLocales[targetSense.senseId] ?? {}
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

// ===== 結果画面 =====
function ResultScreen({
  cards,
  results,
  onRestart,
  onRetryWrong,
}: {
  cards: QuizCard[]
  results: boolean[]
  onRestart: () => void
  onRetryWrong: () => void
}) {
  const correct = results.filter(Boolean).length
  const correctCards = cards.filter((_, i) => results[i])
  const wrongCards = cards.filter((_, i) => !results[i])

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* スコア */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-1">結果</h2>
        <p className="text-6xl font-bold text-green-600 my-4">
          {correct}
          <span className="text-2xl text-gray-400 font-normal"> / {cards.length}</span>
        </p>
      </div>

      {/* まだ */}
      {wrongCards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-red-400 mb-2">× まだ（{wrongCards.length}語）</h3>
          <div className="bg-red-50 rounded-xl overflow-hidden">
            {wrongCards.map((card, i) => (
              <div key={`wrong-${card.word}-${i}`} className="flex items-center gap-3 px-4 py-2.5 border-b border-red-100 last:border-0">
                <span className="font-semibold text-gray-700 w-32 truncate">{card.word}</span>
                <span className="text-gray-400 text-sm truncate">{card.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 覚えた */}
      {correctCards.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-green-500 mb-2">○ 覚えた（{correctCards.length}語）</h3>
          <div className="bg-green-50 rounded-xl overflow-hidden">
            {correctCards.map((card, i) => (
              <div key={`correct-${card.word}-${i}`} className="flex items-center gap-3 px-4 py-2.5 border-b border-green-100 last:border-0">
                <span className="font-semibold text-gray-700 w-32 truncate">{card.word}</span>
                <span className="text-gray-400 text-sm truncate">{card.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-3">
        {wrongCards.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="flex-1 py-3 rounded-full border-2 border-red-400 text-red-400 font-semibold hover:bg-red-50 transition-colors"
          >
            × だけもう一度
          </button>
        )}
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
        >
          全部もう一度
        </button>
      </div>
    </div>
  )
}

// ===== クイズカード =====
function CardView({
  card,
  revealed,
  onReveal,
  onAnswer,
  current,
  total,
}: {
  card: QuizCard
  revealed: boolean
  onReveal: () => void
  onAnswer: (correct: boolean) => void
  current: number
  total: number
}) {
  const playAudio = () => {
    if (card.audioPath) new Audio(card.audioPath).play()
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* プログレス */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-gray-400 tabular-nums">{current} / {total}</span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-300"
            style={{ width: `${((current - 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* カード */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* 表：単語 */}
        <div className="px-8 py-10 text-center">
          <p className="text-4xl font-bold text-gray-800 tracking-wide mb-2">{card.word}</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            {card.ipa && <span className="text-sm">/{card.ipa}/</span>}
            {card.audioPath && (
              <button onClick={playAudio} className="p-1 hover:text-gray-600 transition-colors">
                <BsVolumeUp size={16} />
              </button>
            )}
          </div>
        </div>

        {/* 裏：意味 + 例文 */}
        {revealed && (
          <div className="border-t border-gray-100 px-6 py-5">
            <p className="text-2xl font-semibold text-gray-800 mb-1">{card.meaning}</p>
            {card.meaningEn && (
              <p className="text-gray-400 text-sm mb-4">{card.meaningEn}</p>
            )}
            {card.example && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                <p className="text-gray-700 leading-relaxed">{card.example}</p>
                {card.exampleJa && (
                  <p className="text-gray-400 mt-1.5 leading-relaxed">{card.exampleJa}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 答えを見るボタン */}
        {!revealed && (
          <div className="border-t border-gray-50 px-6 py-5 text-center">
            <button
              onClick={onReveal}
              className="text-gray-400 border border-gray-200 px-6 py-2 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              答えを見る
            </button>
          </div>
        )}
      </div>

      {/* ○/× ボタン */}
      {revealed && (
        <div className="flex gap-3">
          <button
            onClick={() => onAnswer(false)}
            className="flex-1 py-4 rounded-2xl bg-red-50 text-red-500 font-bold text-lg hover:bg-red-100 active:scale-95 transition-all"
          >
            × まだ
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="flex-1 py-4 rounded-2xl bg-green-50 text-green-600 font-bold text-lg hover:bg-green-100 active:scale-95 transition-all"
          >
            ○ 覚えた
          </button>
        </div>
      )}
    </div>
  )
}

// ===== メイン =====
export default function QuizClient() {
  const [cards, setCards] = useState<QuizCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  const loadCards = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const wordList = await fetchWordlists(data.user.id)
    const built = buildQuizCards(wordList)
    setCards(shuffle(built))
    setLoading(false)
  }

  useEffect(() => {
    toast.dismiss() // 前ページからの残存トーストを消す
    loadCards()
  }, [])

  const handleReveal = () => setRevealed(true)

  const handleAnswer = (correct: boolean) => {
    const newResults = [...results, correct]
    setResults(newResults)
    if (currentIndex + 1 >= cards.length) {
      setDone(true)
    } else {
      setCurrentIndex(i => i + 1)
      setRevealed(false)
    }
  }

  const handleRestart = () => {
    setCards(prev => shuffle(prev))
    setCurrentIndex(0)
    setRevealed(false)
    setResults([])
    setDone(false)
  }

  const handleRetryWrong = () => {
    const wrongCards = cards.filter((_, i) => !results[i])
    setCards(shuffle(wrongCards))
    setCurrentIndex(0)
    setRevealed(false)
    setResults([])
    setDone(false)
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (cards.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>保存した単語がありません</p>
        <a href="/" className="mt-4 inline-block text-green-600 underline text-sm">単語を検索する</a>
      </div>
    )
  }

  if (done) {
    return <ResultScreen cards={cards} results={results} onRestart={handleRestart} onRetryWrong={handleRetryWrong} />
  }

  return (
    <CardView
      card={cards[currentIndex]}
      revealed={revealed}
      onReveal={handleReveal}
      onAnswer={handleAnswer}
      current={currentIndex + 1}
      total={cards.length}
    />
  )
}
