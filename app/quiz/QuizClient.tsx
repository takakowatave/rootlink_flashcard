'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchWordlists, saveQuizResult } from '@/lib/supabaseApi'
import { BsVolumeUp } from 'react-icons/bs'
import toast from 'react-hot-toast'
import type { SavedWordDictionary, SavedWordSense, SavedWordSenseGroup } from '@/types/Dictionary'
import QuizDashboard from './QuizDashboard'
import { colors } from '@/lib/colors'
import WordPageClient from '@/components/WordPageClient'
import Button from '@/components/Button'
import { BsArrowUpRightSquare, BsX } from 'react-icons/bs'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import { HiX } from 'react-icons/hi'
import { KEY_SEEN, KEY_STEP, TOTAL_STEPS } from '@/components/TutorialOverlay'

const QUIZ_CARD_STEP = 6

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
// inlineスタイル(style={{color}})で使うため、トークン名ではなく実際のhex値を使う
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
    <div className="bg-white min-h-screen">
    <div className="max-w-[700px] mx-auto px-4 py-8 relative">
      <Sparkles show={showSparkles} />

      {/* スコアカード */}
      <div className="relative bg-primary-subtle rounded-2xl p-6 mb-6 overflow-hidden flex flex-col items-center">
        <Sparkles show={showSparkles} />
        <p className="text-xs font-medium text-secondary bg-primary-light px-3 py-1 rounded-full mb-3">わかった数</p>
        <p className="text-5xl font-bold text-gray-900 mb-1">
          {correct}<span className="text-2xl text-gray-400 font-normal">/{total}</span>
        </p>
        <p className="text-base font-bold italic text-gray-600 mt-2">{message}</p>
      </div>

      {/* 次へボタン */}
      <Button onClick={onBack} variant="primary" size="lg" fullWidth className="mb-6">
        次へ
      </Button>

      {/* わからなかった */}
      {wrongCards.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500">わからなかった（{wrongCards.length}語）</h3>
            <Button onClick={onRetryWrong} variant="secondary" size="sm">
              <span>↺</span> {wrongCards.length}問を復習
            </Button>
          </div>
          {wrongCards.map((card, i) => (
            <div key={`wrong-${card.word}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded" onClick={() => handleWordTap(card.word)}>
              <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
              <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
              <span className="text-gray-300 text-base leading-none">›</span>
            </div>
          ))}
        </div>
      )}

      {/* わかった */}
      {correctCards.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-secondary mb-2">わかった（{correctCards.length}語）</h3>
          {correctCards.map((card, i) => (
            <div key={`correct-${card.word}-${i}`} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded" onClick={() => handleWordTap(card.word)}>
              <span className="font-semibold text-gray-800 w-36 truncate">{card.word}</span>
              <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
              <span className="text-gray-300 text-base leading-none">›</span>
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
                <a href={`/word/${selectedWord.word}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <BsArrowUpRightSquare size={24} />
                </a>
                <button onClick={() => setSelectedWord(null)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                  <BsX size={24} />
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
          <p className="text-gray-600 text-base mt-2 leading-relaxed">
            {renderJaHighlighted(card.exampleJa)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '100dvh' }}>
      {/* クイズ専用ヘッダー */}
      <header className="h-10 bg-white border-b border-line shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <Button onClick={onQuit} variant="secondary" size="sm">終了</Button>
      </header>

      <div className="flex flex-col mx-auto w-full max-w-[700px] flex-1 min-h-0">
        {/* プログレスバー */}
        <div className="h-1 mx-4 mt-4 bg-gray-100 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>

        {/* カード */}
        <div className="flex-1 relative md:mx-4 md:mt-3 md:mb-3 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 bg-white overflow-hidden">
          <div className="p-5">
            {/* タブ（セグメントコントロール） */}
            <div className="inline-flex border border-divider rounded-[4px] overflow-hidden mb-4">
              <button
                onClick={() => card.example && onModeChange('example')}
                disabled={!card.example}
                className={`px-6 h-8 text-base font-bold transition-colors ${mode === 'example' ? 'bg-primary-light text-secondary' : !card.example ? 'bg-white text-gray-300 cursor-not-allowed' : 'bg-white text-dim'}`}
              >
                例文
              </button>
              <button
                onClick={() => onModeChange('word')}
                className={`px-6 h-8 text-base transition-colors ${mode === 'word' ? 'bg-primary-light text-secondary font-bold' : 'bg-white text-dim font-normal'}`}
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
                {card.ipa && <span className="text-base">/{card.ipa}/</span>}
                <button onClick={playAudio} disabled={audioLoading} className="p-1 hover:text-gray-600 transition-colors disabled:opacity-50">
                  {audioLoading
                    ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    : <BsVolumeUp size={20} />
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
                <div className="mt-3 bg-gray-50 rounded-xl p-3 text-base">
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
            className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-primary text-white text-sm font-medium shadow-md hover:bg-primary-hover active:scale-95 transition-all"
          >
            解説
          </button>
        </div>

        {/* 判定ボタン */}
        <div className="flex gap-3 px-4 pb-6 shrink-0">
          <Button onClick={() => onAnswer(false)} variant="secondary" size="lg" className="flex-1">
            わからない
          </Button>
          <Button onClick={() => onAnswer(true)} variant="primary" size="lg" className="flex-1">
            わかる
          </Button>
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
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<QuizMode>('example')
  const [showDashboard, setShowDashboard] = useState(true)
  const [wordListEntries, setWordListEntries] = useState<WordlistEntry[]>([])
  const [cardTutorialVisible, setCardTutorialVisible] = useState(false)

  const loadCards = async (quizMode: 'all' | 'review' = 'all') => {
    setLoading(true)
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); setLoading(false); return }
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

    // チュートリアル step6 チェック
    if (!localStorage.getItem(KEY_SEEN) && localStorage.getItem(KEY_STEP) === String(QUIZ_CARD_STEP)) {
      setTimeout(() => setCardTutorialVisible(true), 400)
    }
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
    return (
      <>
        <QuizDashboard onStart={loadCards} onBack={() => router.push('/wordlist')} />
        {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      </>
    )
  }

  if (loading) {
    return <div className="py-20 text-center text-gray-400">読み込み中...</div>
  }

  if (cards.length === 0) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>保存した単語がありません</p>
        <a href="/wordlist" className="mt-4 inline-block text-primary underline text-sm">単語リストへ</a>
      </div>
    )
  }

  if (done) {
    return <ResultScreen cards={cards} results={results} wordListEntries={wordListEntries} onRestart={handleRestart} onRetryWrong={handleRetryWrong} onBack={() => setShowDashboard(true)} />
  }

  const finishCardTutorial = () => {
    localStorage.setItem(KEY_SEEN, '1')
    localStorage.removeItem(KEY_STEP)
    setCardTutorialVisible(false)
  }

  return (
    <>
      <CardView
        card={cards[currentIndex]}
        onAnswer={handleAnswer}
        current={currentIndex + 1}
        total={cards.length}
        mode={mode}
        onModeChange={setMode}
        onQuit={() => setShowDashboard(true)}
      />
      {cardTutorialVisible && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="fixed inset-0 bg-black/70 pointer-events-auto" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
              <button onClick={finishCardTutorial} className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors" aria-label="閉じる">
                <HiX className="size-4" />
              </button>
              <div className="text-3xl text-center mb-3 select-none">🎯</div>
              <h2 className="text-base font-bold text-center text-gray-900 mb-2">クイズの使い方</h2>
              <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
                単語や例文を見て意味を思い出したら「わかる」、思い出せなかったら「わからない」を押しましょう。間違えた単語だけ再挑戦することもできます。
              </p>
              <div className="flex justify-center gap-1.5 mb-4">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <span key={i} className={`block size-1.5 rounded-full transition-colors ${i === QUIZ_CARD_STEP ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
              </div>
              <button
                onClick={finishCardTutorial}
                className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors"
              >
                はじめる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
