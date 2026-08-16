'use client'

import { useCallback, useEffect, useState } from 'react'
import { BsArrowUpRightSquare, BsX } from 'react-icons/bs'
import { HiX } from 'react-icons/hi'
import { HiSpeakerWave } from 'react-icons/hi2'
import Button from '@/components/Button'
import EtymologyBlock from '@/components/EtymologyBlock'
import LearnedPartWords from '@/components/LearnedPartWords'
import WordPageClient from '@/components/WordPageClient'
import { colors } from '@/lib/colors'
import { readLocalizedEtymologyJa } from '@/lib/etymologyDisplay'
import { displayPhrase } from '@/lib/phraseDisplay'
import { useTtsAudio } from '@/lib/useTtsAudio'
import { POS_LABEL_JA } from '@/lib/pos'
import type { SavedWordDictionary, SavedWordSense, SavedWordSenseGroup } from '@/types/Dictionary'
import type { EtymologyData, LocalizedEtymologyJa } from '@/types/Etymology'

const QUIZ_CARD_TUTORIAL_KEY = 'rootlink_quiz_card_tutorial_v1_seen'

// ─── Public types ────────────────────────────────────────────────────────────

export type QuizCard = {
  word: string
  ipa?: string
  audioPath?: string
  meaning: string
  meaningEn: string
  example?: string
  exampleJa?: string
  senseId?: string
  pos?: string
  phrase_card_id?: string
  etymology?: string
  etymologyData?: EtymologyData | null
  localizedEtymologyJa?: LocalizedEtymologyJa | null
}

export type QuizEntry = {
  word: string
  dictionary: SavedWordDictionary | null
  pinned_sense_id?: string | null
  phrase_card_id?: string
  phrase_meaning_ja?: string | null
  phrase_meaning_en?: string | null
  phrase_example_en?: string | null
  phrase_example_ja?: string | null
  phrase_type?: string | null
}

// ─── buildQuizCards ───────────────────────────────────────────────────────────

export function buildQuizCards(entries: QuizEntry[]): QuizCard[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const cards: QuizCard[] = []

  for (const item of entries) {
    if (!item.word) continue

    // フレーズ
    if (item.phrase_card_id) {
      const meaning = item.phrase_meaning_ja ?? item.phrase_meaning_en ?? ''
      if (!meaning) continue
      cards.push({
        word: item.word,
        meaning,
        meaningEn: item.phrase_meaning_en ?? '',
        example: item.phrase_example_en ?? undefined,
        exampleJa: item.phrase_example_ja ?? undefined,
        phrase_card_id: item.phrase_card_id,
      })
      continue
    }

    const d = item.dictionary
    if (!d) continue

    const senseGroups: SavedWordSenseGroup[] = d.senseGroups ?? []
    const jaLocales = d.locales?.ja?.senses ?? {}
    const pinnedSenseId: string | null = item.pinned_sense_id ?? null

    let targetSense: SavedWordSense | null = null
    let targetPos: string | undefined
    outer: for (const group of senseGroups) {
      for (const sense of group.senses ?? []) {
        if (!targetSense) { targetSense = sense; targetPos = group.partOfSpeech }
        if (sense.senseId === pinnedSenseId) { targetSense = sense; targetPos = group.partOfSpeech; break outer }
      }
    }
    if (!targetSense) continue

    const senseId = targetSense.senseId ?? ''
    const ja = jaLocales[senseId] ?? {}
    const meaning = ja.meaning ?? targetSense.definition ?? ''
    if (!meaning) continue

    const audioFile = d.audio?.audioUrl
      ?? (d.audio?.audioPath
        ? `${supabaseUrl}/storage/v1/object/public/${d.audio.audioPath}`
        : undefined)

    cards.push({
      word: item.word,
      ipa: d.ipa ?? undefined,
      audioPath: audioFile,
      meaning,
      meaningEn: targetSense.definition ?? '',
      example: typeof targetSense.example === 'string' ? targetSense.example : undefined,
      exampleJa: ja.exampleTranslation ?? undefined,
      senseId,
      pos: targetPos,
      etymology: typeof d.etymology === 'string' ? d.etymology : undefined,
      etymologyData: d.etymologyData ?? null,
      localizedEtymologyJa: readLocalizedEtymologyJa(d),
    })
  }

  return cards
}

export function shuffleCards<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── Internal sub-components ──────────────────────────────────────────────────

type QuizMode = 'example' | 'word'

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
          <div key={s.id} className="sparkle absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, color: s.color, '--dur': `${s.duration}s`, '--delay': `${s.delay}s` } as React.CSSProperties}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
          </div>
        ))}
      </div>
    </>
  )
}

function WordDetailModal({ entry, onClose }: { entry: QuizEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85dvh] flex flex-col shadow-xl overflow-x-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-end px-5 py-3 border-b border-line flex-shrink-0">
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
          <WordPageClient word={entry.word} dictionary={entry.dictionary} savedId={undefined} initialPinnedSenseId={entry.pinned_sense_id ?? null} noCard />
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
  const isPhrase = !!card.phrase_card_id

  const headword = useTtsAudio(
    isPhrase
      ? { endpoint: '/audio/phrase/headword', body: { phrase_card_id: card.phrase_card_id! } }
      : { endpoint: '/audio', body: { word: card.word }, initialUrl: card.audioPath ?? null }
  )
  const example = useTtsAudio(
    isPhrase
      ? { endpoint: '/audio/phrase', body: { phrase_card_id: card.phrase_card_id! }, playbackRate: 1.2 }
      : { endpoint: '/audio/word/example', body: { word: card.word, sense_id: card.senseId ?? '' }, playbackRate: 1.2 }
  )

  useEffect(() => {
    setRevealed(false)
    if (!card.example) onModeChange('word')
  }, [current, card.example, onModeChange])

  const renderJaHighlighted = (ja: string) => {
    if (!card.meaning) return <>{ja}</>
    const base = card.meaning.split(/[のをにはがでともや、。・\s]+/).filter(s => s.length >= 2 || /\p{Script=Han}/u.test(s))
    // 動詞・形容詞の活用を吸収: 「称賛する」→漢字連続「称賛」だけでも一致させる
    const kanjiChunks = card.meaning.match(/\p{Script=Han}{2,}/gu) ?? []
    const candidates = Array.from(new Set([...base, ...kanjiChunks])).sort((a, b) => b.length - a.length)
    const matches = candidates.filter(c => ja.includes(c))
    if (matches.length === 0) return <>{ja}</>
    const hiRegex = new RegExp(`(${matches.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
    return (
      <>
        {ja.split(hiRegex).map((p, i) =>
          matches.includes(p) ? <span key={i} className="text-orange-400">{p}</span> : p
        )}
      </>
    )
  }

  const renderExample = () => {
    const text = card.example
    if (!text) return null
    // 活用形もハイライトする（run→ran/running, shove→shoving/shoved 等）。
    // サーバ側 exampleContainsHeadword と同じ語幹戦略：短語は完全語＋短い接尾辞、長語は先頭 stem 前方一致。
    const hw = card.word.toLowerCase().trim()
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = isPhrase
      ? escape(hw)
      : hw.length <= 3
        ? `\\b${escape(hw)}[a-z]{0,3}\\b`
        : `\\b${escape(hw.slice(0, Math.max(4, hw.length - 2)))}[a-z]*\\b`
    const regex = new RegExp(`(${pattern})`, 'gi')
    const parts = text.split(regex)
    const isMatch = (s: string) => new RegExp(`^${pattern}$`, 'i').test(s)
    return (
      <div>
        <p className="text-2xl font-bold text-gray-800 leading-relaxed">
          {parts.map((part, i) =>
            isMatch(part)
              ? <span key={i} className="text-orange-400">{part}</span>
              : part
          )}
        </p>
        <div className="mt-2 h-5 text-gray-400">
          <button onClick={example.play} disabled={example.loading} className="p-1 hover:text-gray-600 transition-colors disabled:opacity-50">
            {example.loading
              ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
              : <HiSpeakerWave className="size-5" />}
          </button>
        </div>
        {revealed && card.exampleJa && (
          <p className="text-gray-600 text-base mt-2 leading-relaxed">{renderJaHighlighted(card.exampleJa)}</p>
        )}
        {revealed && (
          <>
            <EtymologyBlock
              headword={card.word}
              etymologyData={card.etymologyData ?? null}
              localizedEtymologyJa={card.localizedEtymologyJa ?? null}
              etymology={card.etymology ?? ''}
              displayLocale="ja"
              withTutorialAttr={false}
            />
            <LearnedPartWords
              headword={card.word}
              etymologyData={card.etymologyData ?? null}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="h-10 bg-white border-b border-line shadow-[0_1px_1px_rgba(0,0,0,0.05)] flex items-center px-2 shrink-0">
        <Button onClick={onQuit} variant="secondary" size="sm">終了</Button>
      </header>
      <div className="flex flex-col mx-auto w-full max-w-[700px] flex-1 min-h-0">
        <div className="mx-4 mt-4 flex items-center gap-2 shrink-0">
          <div className="flex-1 h-3 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
          </div>
          <p className="text-sm text-[#90a1b9] tabular-nums whitespace-nowrap">
            {current} / {total}
          </p>
        </div>
        <div className="flex-1 min-h-0 relative flex flex-col md:mx-4 md:mt-3 md:mb-3 md:rounded-2xl md:shadow-sm md:border md:border-line bg-white overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-20">
            <div className="inline-flex border border-divider rounded-[4px] overflow-hidden mb-4">
              <button onClick={() => card.example && onModeChange('example')} disabled={!card.example}
                className={`px-6 h-8 text-base font-bold transition-colors ${mode === 'example' ? 'bg-primary-light text-primary-hover' : !card.example ? 'bg-white text-gray-300 cursor-not-allowed' : 'bg-white text-dim'}`}>
                例文
              </button>
              <button onClick={() => onModeChange('word')}
                className={`px-6 h-8 text-base transition-colors ${mode === 'word' ? 'bg-primary-light text-primary-hover font-bold' : 'bg-white text-dim font-normal'}`}>
                単語
              </button>
            </div>
            {mode === 'example' && card.example ? renderExample() : (
              <div>
                {card.pos && (
                  <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted mb-2">
                    {POS_LABEL_JA[card.pos] ?? card.pos}
                  </span>
                )}
                <p className="text-4xl font-bold text-gray-800 tracking-wide">{isPhrase ? displayPhrase(card.word) : card.word}</p>
                <div className="flex items-center gap-2 mt-2 h-5 text-gray-400">
                  {card.ipa && <span className="text-base">/{card.ipa}/</span>}
                  <button onClick={headword.play} disabled={headword.loading} className="p-1 hover:text-gray-600 transition-colors disabled:opacity-50">
                    {headword.loading
                      ? <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                      : <HiSpeakerWave className="size-5" />}
                  </button>
                </div>
              </div>
            )}
            {revealed && mode === 'word' && (
              <div className="mt-5 pt-4 border-t border-line">
                <p className="text-xl font-semibold text-gray-800">{card.meaning}</p>
                <EtymologyBlock
                  headword={card.word}
                  etymologyData={card.etymologyData ?? null}
                  localizedEtymologyJa={card.localizedEtymologyJa ?? null}
                  etymology={card.etymology ?? ''}
                  displayLocale="ja"
                  withTutorialAttr={false}
                />
                <LearnedPartWords
                  headword={card.word}
                  etymologyData={card.etymologyData ?? null}
                />
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
  entries: QuizEntry[]
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
  const [selectedEntry, setSelectedEntry] = useState<QuizEntry | null>(null)

  const findEntry = (word: string) => entries.find(e => e.word === word) ?? null

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[700px] mx-auto px-4 py-8 relative">
        <Sparkles show={showSparkles} />
        <div className="relative bg-primary-subtle rounded-2xl p-6 mb-6 overflow-hidden flex flex-col items-center">
          <Sparkles show={showSparkles} />
          <p className="text-xs font-medium text-primary-hover bg-primary-light px-3 py-1 rounded-full mb-3">わかった数</p>
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
              <div key={`wrong-${card.word}-${i}`} onClick={() => setSelectedEntry(findEntry(card.word))}
                className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
                <span className="font-semibold text-gray-800 w-36 truncate">{card.phrase_card_id ? displayPhrase(card.word) : card.word}</span>
                <span className="text-gray-400 text-sm truncate flex-1">{card.meaning}</span>
                <span className="text-gray-300 text-base leading-none">›</span>
              </div>
            ))}
          </div>
        )}
        {correctCards.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-primary-hover mb-2">わかった（{correctCards.length}語）</h3>
            {correctCards.map((card, i) => (
              <div key={`correct-${card.word}-${i}`} onClick={() => setSelectedEntry(findEntry(card.word))}
                className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
                <span className="font-semibold text-gray-800 w-36 truncate">{card.phrase_card_id ? displayPhrase(card.word) : card.word}</span>
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

// ─── QuizSession (main export) ────────────────────────────────────────────────

type Props = {
  initialCards: QuizCard[]
  entries: QuizEntry[]
  onQuit: () => void
  onAnswer?: (word: string, correct: boolean) => void
}

export default function QuizSession({ initialCards, entries, onQuit, onAnswer }: Props) {
  const [cards, setCards] = useState<QuizCard[]>(initialCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<QuizMode>('example')
  const [tutorialVisible, setTutorialVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(QUIZ_CARD_TUTORIAL_KEY)) {
      const t = setTimeout(() => setTutorialVisible(true), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const handleAnswer = (correct: boolean) => {
    const card = cards[currentIndex]
    onAnswer?.(card.word, correct)
    const newResults = [...results, correct]
    setResults(newResults)
    if (currentIndex + 1 >= cards.length) {
      setDone(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleRetryWrong = () => {
    const wrongCards = cards.filter((_, i) => !results[i])
    setCards(shuffleCards(wrongCards))
    setCurrentIndex(0)
    setResults([])
    setDone(false)
  }

  const handleModeChange = useCallback((m: QuizMode) => setMode(m), [])

  const finishTutorial = () => {
    localStorage.setItem(QUIZ_CARD_TUTORIAL_KEY, '1')
    setTutorialVisible(false)
  }

  if (done) {
    return (
      <ResultScreen
        cards={cards}
        results={results}
        entries={entries}
        onRetryWrong={handleRetryWrong}
        onBack={onQuit}
      />
    )
  }

  return (
    <>
      <CardView
        key={`${currentIndex}-${cards[currentIndex]?.word}`}
        card={cards[currentIndex]}
        onAnswer={handleAnswer}
        current={currentIndex + 1}
        total={cards.length}
        mode={mode}
        onModeChange={handleModeChange}
        onQuit={onQuit}
      />
      {tutorialVisible && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="fixed inset-0 bg-black/70 pointer-events-auto" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <div className="relative bg-white rounded-2xl w-[min(340px,90vw)] p-6 shadow-2xl">
              <button onClick={finishTutorial} className="absolute top-3 right-3 p-1 text-muted hover:text-gray-600 transition-colors">
                <HiX className="size-4" />
              </button>
              <div className="text-3xl text-center mb-3 select-none">🎯</div>
              <h2 className="text-base font-bold text-center text-gray-900 mb-2">クイズの使い方</h2>
              <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">
                単語や例文を見て意味を思い出したら「わかる」、思い出せなかったら「わからない」を押しましょう。間違えた単語だけ再挑戦することもできます。
              </p>
              <button onClick={finishTutorial}
                className="w-full bg-primary text-white rounded-full py-2.5 text-sm font-semibold hover:bg-primary-hover transition-colors">
                はじめる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
