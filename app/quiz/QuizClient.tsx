'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchWordlists, saveQuizResult } from '@/lib/supabaseApi'
import { BsVolumeUp } from 'react-icons/bs'
import toast from 'react-hot-toast'
import type { SavedWordDictionary, SavedWordSense, SavedWordSenseGroup } from '@/types/Dictionary'
import QuizDashboard from './QuizDashboard'
import WordPageClient from '@/components/WordPageClient'
import { BsArrowUpRightSquare, BsX } from 'react-icons/bs'

type WordlistEntry = {
  word?: string
  dictionary?: SavedWordDictionary | null
  pinned_sense_id?: string | null
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

function buildQuizCards(wordList: WordlistEntry[]): QuizCard[] {
  const cards: QuizCard[] = []

  for (const item of wordList) {
    if (!item.word) continue
    const d = item.dictionary
    if (!d) continue

    const senseGroups: SavedWordSenseGroup[] = d.senseGroups ?? []
    const jaLocales = d.locales?.ja?.senses ?? {}
    const pinnedSenseId: string | null = item.pinned_sense_id ?? null

    let targetSense: SavedWordSense | null = null
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

    const senseId = targetSense.senseId ?? ''
    const ja = jaLocales[senseId] ?? {}
    const meaning = ja.meaning ?? targetSense.definition ?? ''
    if (!meaning) continue

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const audioFile = d.audio?.audioPath
      ? `${supabaseUrl}/storage/v1/object/public/${d.audio.audioPath}`
      : undefined

    cards.push({
      word: item.word!,
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

// ===== キラキラパーティクル =====
const SPARKLE_COLORS = ['#00AD82', '#00d5be', '#cbfbf1', '#FFD700', '#FF9F43', '#a29bfe', '#fd79a8']

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
          <div
            key={s.id}
            className="sparkle absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              color: s.color,
              '--dur': `${s.duration}s`,
              '--delay': `${s.delay}s`,
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
        ))}
      </div>
    </>
  )
}

// ===== 結果画面 =====
function ResultScreen({
  cards,
  results,
  wordListEntries,
  onRetryWrong,
  onBack,
}: {
  cards: QuizCard[]
  results: boolean[]
  wordListEntries: WordlistEntry[]
  onRestart: () => void
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

  const [selectedWord, setSelectedWord] = useState<WordlistEntry | null>(null)

  const handleWordTap = (word: string) => {
    const entry = wordListEntries.find(e => e.word === word)
    if (entry) setSelectedWord(entry)
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen">
    <div className="max-w-[700px] mx-auto px-4 py-8 relative">
      <Sparkles show={showSparkles} />

      {/* スコアカード */}
      <div className="relative bg-[#f0fdfa] rounded-2xl p-6 mb-6 overflow-hidden flex flex-col items-center">
        <Sparkles show={showSparkles} />
        <p className="text-xs font-medium text-[#009689] bg-[#cbfbf1] px-3 py-1 rounded-full mb-3">わかった数</p>
        <p className="text-5xl font-bold text-gray-900 mb-1">
          {correct}<span className="text-2xl text-gray-400 font-normal">/{total}</span>
        </p>
        <p className="text-base font-bold italic text-gray-600 mt-2">{message}</p>
      </div>

      {/* 次へボタン */}
      <button
        onClick={onBack}
        className="w-full py-4 rounded-2xl bg-[#009689] text-white font-bold text-base hover:bg-[#007a6f] transition-colors mb-6"
      >
        次へ
      </button>

      {/* わからなかった */}
      {wrongCards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">わからなかった（{wrongCards.length}語）</h3>
            <button
              onClick={onRetryWrong}
              className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium hover:bg-[#cbfbf1] transition-colors flex items-center gap-1"
            >
              <span>↺</span> {wrongCards.length}問を復習
            </button>
          </div>
          {wrongCards.map((card, i) => (
            <div key={`wrong-${card.word}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded" onClick={() => handleWordTap(card.word)}>
              <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
              <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
              <span className="text-gray-300 text-xs">›</span>
            </div>
          ))}
        </div>
      )}

      {/* わかった */}
      {correctCards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#009689] mb-2">わかった（{correctCards.length}語）</h3>
          {correctCards.map((card, i) => (
            <div key={`correct-${card.word}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded" onClick={() => handleWordTap(card.word)}>
              <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
              <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
              <span className="text-gray-300 text-xs">›</span>
            </div>
          ))}
        </div>
      )}

      {/* 単語詳細モーダル */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedWord(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl overflow-x-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-1">
                <a href={`/word/${selectedWord.word}`} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <BsArrowUpRightSquare size={18} />
                </a>
                <button onClick={() => setSelectedWord(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <BsX size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <WordPageClient
                word={selectedWord.word!}
                dictionary={selectedWord.dictionary}
                savedId={undefined}
                initialPinnedSenseId={selectedWord.pinned_sense_id}
                noCard
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

// ===== クイズカード =====
function CardView({
  card,
  onAnswer,
  current,
  total,
  mode,
  onModeChange,
  onQuit,
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
      if (data.ok && data.audioUrl) {
        setAudioUrl(data.audioUrl)
        new Audio(data.audioUrl).play()
      }
    } catch { /* silent */ } finally { setAudioLoading(false) }
  }

  const renderExample = () => {
    const text = card.example
    if (!text) return null
    const regex = new RegExp(`(${card.word})`, 'gi')
    const parts = text.split(regex)

    const renderJaHighlighted = (ja: string) => {
      if (!card.meaning) return <>{ja}</>
      const candidates = card.meaning
        .split(/[のをにはがでともや、。・\s]+/)
        .filter(s => s.length >= 2)
        .sort((a, b) => b.length - a.length)
      const matches = candidates.filter(c => ja.includes(c))
      if (matches.length === 0) return <>{ja}</>
      const hiRegex = new RegExp(
        `(${matches.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
        'g'
      )
      return (
        <>
          {ja.split(hiRegex).map((p, i) =>
            matches.includes(p) ? <span key={i} className="text-orange-400">{p}</span> : p
          )}
        </>
      )
    }

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
          <p className="text-gray-600 text-sm mt-2 leading-relaxed">
            {renderJaHighlighted(card.exampleJa)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#f8fafc]" style={{ height: '100dvh' }}>
      {/* クイズ専用ヘッダー */}
      <header className="h-10 bg-white border-b border-[#e2e8f0] shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <button
          onClick={onQuit}
          className="h-8 px-4 rounded-full border border-[#009689] text-[#009689] text-xs font-medium hover:bg-[#cbfbf1] transition-colors"
        >
          終了
        </button>
      </header>

      <div className="flex flex-col mx-auto w-full max-w-[700px] flex-1 min-h-0">
        {/* プログレスバー */}
        <div className="h-1 mx-4 mt-4 bg-gray-100 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-[#00AD82] rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>

        {/* カード */}
        <div className="flex-1 relative md:mx-4 md:mt-3 md:mb-3 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 bg-white overflow-hidden">
          <div className="p-5">
            {/* タブ（セグメントコントロール） */}
            <div className="inline-flex border border-[#dbe0e5] rounded-[4px] overflow-hidden mb-4">
              <button
                onClick={() => card.example && onModeChange('example')}
                disabled={!card.example}
                className={`px-6 h-8 text-sm font-bold transition-colors ${mode === 'example' ? 'bg-[#cbfbf1] text-[#009689]' : !card.example ? 'bg-white text-gray-300 cursor-not-allowed' : 'bg-white text-[#6f777f]'}`}
              >
                例文
              </button>
              <button
                onClick={() => onModeChange('word')}
                className={`px-6 h-8 text-sm transition-colors ${mode === 'word' ? 'bg-[#cbfbf1] text-[#009689] font-bold' : 'bg-white text-[#6f777f] font-normal'}`}
              >
                単語
              </button>
            </div>

          {/* コンテンツ */}
          {mode === 'example' && card.example ? (
            renderExample()
          ) : (
            <div>
              <p className="text-4xl font-bold text-gray-800 tracking-wide">{card.word}</p>
              <div className="flex items-center gap-2 mt-2 h-5 text-gray-400">
                {card.ipa && <span className="text-sm">/{card.ipa}/</span>}
                <button onClick={playAudio} disabled={audioLoading} className="p-1 hover:text-gray-600 transition-colors disabled:opacity-50">
                  {audioLoading
                    ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    : <BsVolumeUp size={16} />
                  }
                </button>
              </div>
            </div>
          )}

          {/* 解説（展開時） */}
          {revealed && mode === 'word' && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xl font-semibold text-gray-800">{card.meaning}</p>
              {card.example && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3 text-sm">
                  <p className="text-gray-700 leading-relaxed">{card.example}</p>
                  {card.exampleJa && (
                    <p className="text-gray-400 mt-1.5 leading-relaxed">{card.exampleJa}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

          {/* 解説ボタン */}
          <button
            onClick={() => setRevealed(r => !r)}
            className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-[#00AD82] text-white text-xs font-medium shadow-md hover:bg-[#009970] active:scale-95 transition-all"
          >
            解説
          </button>
        </div>

        {/* 判定ボタン */}
        <div className="flex gap-3 px-4 pb-6 shrink-0">
          <button
            onClick={() => onAnswer(false)}
            className="flex-1 py-4 rounded-2xl bg-white border border-[#009689] text-[#009689] font-bold text-base active:scale-95 transition-all hover:bg-[#cbfbf1]"
          >
            わからない
          </button>
          <button
            onClick={() => onAnswer(true)}
            className="flex-1 py-4 rounded-2xl bg-[#00AD82] text-white font-bold text-base active:scale-95 transition-all"
          >
            わかる
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== メイン =====
export default function QuizClient() {
  const router = useRouter()
  const [cards, setCards] = useState<QuizCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<QuizMode>('example')
  const [showDashboard, setShowDashboard] = useState(true)
  const [wordListEntries, setWordListEntries] = useState<WordlistEntry[]>([])

  const loadCards = async (quizMode: 'all' | 'review' = 'all') => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const wordList = await fetchWordlists(data.user.id)
    setWordListEntries(wordList)
    let built = buildQuizCards(wordList)

    if (quizMode === 'review') {
      const { data: mastery } = await supabase
        .from('word_mastery')
        .select('word, wrong_count')
        .eq('user_id', data.user.id)
        .eq('status', 'needs_review')
        .order('wrong_count', { ascending: false })
        .limit(10)
      const reviewWords = new Set((mastery ?? []).map(m => m.word))
      built = built.filter(c => reviewWords.has(c.word))
    }

    setCards(shuffle(built).slice(0, 10))
    setLoading(false)
    setShowDashboard(false)
    setCurrentIndex(0)
    setResults([])
    setDone(false)
  }

  useEffect(() => {
    toast.dismiss()
  }, [])

  const handleAnswer = async (correct: boolean) => {
    const card = cards[currentIndex]
    saveQuizResult(card.word, correct)

    // word_mastery更新
    const { data: auth } = await supabase.auth.getUser()
    if (auth.user) {
      const { data: existing } = await supabase
        .from('word_mastery')
        .select('correct_streak, wrong_count')
        .eq('user_id', auth.user.id)
        .eq('word', card.word)
        .maybeSingle()

      const streak = correct ? (existing?.correct_streak ?? 0) + 1 : 0
      const wrongCount = correct ? (existing?.wrong_count ?? 0) : (existing?.wrong_count ?? 0) + 1
      const status = streak >= 2 ? 'mastered' : correct ? 'mastered' : 'needs_review'

      await supabase.from('word_mastery').upsert({
        user_id: auth.user.id,
        word: card.word,
        status: streak >= 2 ? 'mastered' : correct ? 'mastered' : 'needs_review',
        correct_streak: streak,
        wrong_count: wrongCount,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,word' })
    }

    const newResults = [...results, correct]
    setResults(newResults)
    if (currentIndex + 1 >= cards.length) {
      setDone(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleRestart = () => {
    setCards(prev => shuffle(prev))
    setCurrentIndex(0)
    setResults([])
    setDone(false)
  }

  const handleRetryWrong = () => {
    const wrongCards = cards.filter((_, i) => !results[i])
    setCards(shuffle(wrongCards))
    setCurrentIndex(0)
    setResults([])
    setDone(false)
  }

  if (showDashboard) {
    return <QuizDashboard onStart={loadCards} onBack={() => router.push('/wordlist')} />
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (cards.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>保存した単語がありません</p>
        <a href="/wordlist" className="mt-4 inline-block text-[#00AD82] underline text-sm">単語リストへ</a>
      </div>
    )
  }

  if (done) {
    return <ResultScreen cards={cards} results={results} wordListEntries={wordListEntries} onRestart={handleRestart} onRetryWrong={handleRetryWrong} onBack={() => setShowDashboard(true)} />
  }

  return (
    <CardView
      card={cards[currentIndex]}
      onAnswer={handleAnswer}
      current={currentIndex + 1}
      total={cards.length}
      mode={mode}
      onModeChange={setMode}
      onQuit={() => setShowDashboard(true)}
    />
  )
}
