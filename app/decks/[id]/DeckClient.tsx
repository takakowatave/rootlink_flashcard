'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { fetchDeckWords, getUserPlan, saveQuizResult, toggleSaveStatus } from '@/lib/supabaseApi'
import Button from '@/components/Button'
import PageHeader from '@/components/PageHeader'
import EntryCard from '@/components/EntryCard'
import WordDetailModal from '@/components/WordDetailModal'
import { buildPronunciation, buildSenses } from '@/lib/dictionaryRender'
import type { SavedWordDictionary } from '@/types/Dictionary'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import QuizSession, { buildQuizCards, shuffleCards } from '@/components/QuizSession'
import type { QuizEntry } from '@/components/QuizSession'
import { type QuizScope } from '@/components/QuizScopeSelector'
import { classifyQuizStatus, classifyForDonut, type WordStatus } from '@/lib/quizScope'
import QuizProgressPanel from '@/components/QuizProgressPanel'
import SignupRequiredModal from '@/components/SignupRequiredModal'
import UpgradeModal from '@/components/UpgradeModal'
import toast from 'react-hot-toast'

type DeckInfo = {
  id: string
  name: string
  label: string
  description: string | null
  is_premium: boolean
}

type DeckWordEntry = {
  word: string
  meaning: string | null
  dictionary: SavedWordDictionary | null
  pinned_sense_id: string | null
}

const INITIAL_VISIBLE = 30
const LOAD_MORE_STEP = 30

export default function DeckClient({ deck }: { deck: DeckInfo }) {
  const [entries, setEntries] = useState<DeckWordEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [wrongCounts, setWrongCounts] = useState<Map<string, number>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('all')
  const [isAuthed, setIsAuthed] = useState<boolean>(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [plan, setPlan] = useState<'premium' | 'free' | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [selectedEntry, setSelectedEntry] = useState<DeckWordEntry | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const openWord = useCallback((entry: DeckWordEntry) => {
    setSelectedEntry(entry)
  }, [])
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  const loadStatus = useCallback(async (data: DeckWordEntry[], userId: string) => {
    const words = data.map(e => e.word)
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, answered_at')
      .eq('user_id', userId)
      .in('word', words)
      .order('answered_at', { ascending: false })
      .limit(10000)
    const { status, wrongCount } = classifyQuizStatus(
      (qr ?? []) as { word: string; correct: boolean }[],
      words,
    )
    setWordStatus(status)
    setWrongCounts(wrongCount)
  }, [])

  const loadSavedWords = useCallback(async (userId: string, deckWords: string[]) => {
    if (deckWords.length === 0) { setSavedWords(new Set()); return }
    const { data: wordRows } = await supabase
      .from('words')
      .select('id, word')
      .in('word', deckWords)
      .limit(2000)
    const wordIds = (wordRows ?? []).map(r => r.id)
    if (wordIds.length === 0) { setSavedWords(new Set()); return }
    const idToWord = new Map((wordRows ?? []).map(r => [r.id, r.word as string]))
    const { data: savedRows } = await supabase
      .from('saved_words')
      .select('word_id')
      .eq('user_id', userId)
      .in('word_id', wordIds)
      .limit(2000)
    setSavedWords(new Set((savedRows ?? []).map(r => idToWord.get(r.word_id as string) ?? '').filter(Boolean)))
  }, [])

  const reload = useCallback(async () => {
    const [data, { data: authData }] = await Promise.all([
      fetchDeckWords(deck.id),
      supabase.auth.getUser(),
    ])
    setEntries(data)
    setIsAuthed(!!authData.user)
    if (authData.user) {
      if (data.length > 0) await loadStatus(data, authData.user.id)
      await loadSavedWords(authData.user.id, data.map(e => e.word))
      setPlan(await getUserPlan())
    } else {
      setPlan('free')
    }
    setLoading(false)
  }, [deck.id, loadStatus, loadSavedWords])

  useEffect(() => {
    toast.dismiss()
    reload()
  }, [reload])

  const handleToggleSave = async (entry: DeckWordEntry) => {
    if (!isAuthed) { setShowSignupModal(true); return }
    const result = await toggleSaveStatus({ word: entry.word, dictionary: entry.dictionary ?? undefined })
    if (!result.success) { toast.error('処理に失敗しました'); return }
    setSavedWords(prev => {
      const s = new Set(prev)
      if (s.has(entry.word)) s.delete(entry.word); else s.add(entry.word)
      return s
    })
  }

  const availableEntries = entries.filter(e => !!e.dictionary)
  const availableCount = availableEntries.length

  const hardWords = availableEntries.filter(e => (wrongCounts.get(e.word) ?? 0) >= 2)
  const reviewWords = availableEntries.filter(
    e => wordStatus.get(e.word) === 'review' && (wrongCounts.get(e.word) ?? 0) < 2,
  )
  const unseenWords = availableEntries.filter(e => wordStatus.get(e.word) === 'unseen')

  const { mastered: masteredCount, review: reviewCount, hard: hardCount, unseen: unseenCount } =
    classifyForDonut(wordStatus, wrongCounts, entries.map(e => e.word))

  const scopeSource: Record<QuizScope, typeof availableEntries> = {
    all: availableEntries,
    unseen: unseenWords,
    review: reviewWords,
    hard: hardWords,
    recent: availableEntries,
  }

  const isLocked = deck.is_premium && plan === 'free'

  const startQuiz = useCallback(() => {
    if (!isAuthed) { setShowSignupModal(true); return }
    if (isLocked) { setShowUpgradeModal(true); return }
    const sourceEntries = scopeSource[quizScope]
    const cards = shuffleCards(buildQuizCards(sourceEntries)).slice(0, 10)
    const sessionEntries: QuizEntry[] = cards.map(c =>
      sourceEntries.find(e => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }, [isAuthed, isLocked, quizScope, scopeSource])

  const handleQuizAnswer = useCallback(async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct, deck.id)
    setWordStatus(prev => new Map(prev).set(word, correct ? 'mastered' : 'review'))
    if (!correct) setWrongCounts(prev => new Map(prev).set(word, (prev.get(word) ?? 0) + 1))
  }, [deck.id])

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
    <>
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}
      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} reason="upgrade" />}

      <PageHeader
        items={[
          { label: 'ホーム', href: '/' },
          { label: '教材一覧', href: '/decks' },
          { label: deck.name },
        ]}
      />

      <QuizProgressPanel
        header={
          <div>
            <span className="text-xs font-semibold text-primary bg-primary-subtle px-2 py-0.5 rounded-full">{deck.label}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">{deck.name}</h2>
            {deck.description && <p className="text-sm text-gray-500 mt-1">{deck.description}</p>}
          </div>
        }
        mastered={masteredCount}
        review={reviewCount}
        hard={hardCount}
        unseen={unseenCount}
        scopeItems={[
          { key: 'all', count: availableCount },
          { key: 'unseen', count: unseenWords.length },
          { key: 'review', count: reviewWords.length },
          { key: 'hard', count: hardWords.length },
        ]}
        selectedScope={quizScope}
        onScopeChange={setQuizScope}
        buttonLabel={
          loading
            ? '読み込み中...'
            : isLocked
              ? '🔒 プレミアム登録ではじめる'
              : availableCount === 0
                ? '単語データがまだありません'
                : 'はじめる'
        }
        buttonDisabled={loading || (!isLocked && scopeSource[quizScope].length === 0)}
        onStart={startQuiz}
      />

      {/* ── 単語一覧プレビュー ── */}
      {!loading && availableEntries.length > 0 && (
        <section>
          <div className="flex flex-col gap-3">
            {availableEntries.slice(0, visibleCount).map((entry) => {
              const d = entry.dictionary
              const pronunciation = buildPronunciation(d)
              const senses = buildSenses(d, displayLocale)
              const inflections: string[] = d?.inflections ?? []
              const allSenses = Object.values(senses).flat()
              const firstSenseId = allSenses[0]?.senseId ?? null
              const pinnedSenseId = entry.pinned_sense_id ?? firstSenseId
              return (
                <div
                  key={entry.word}
                  onClick={() => openWord(entry)}
                  className="cursor-pointer"
                >
                  <EntryCard
                    headword={entry.word}
                    pronunciation={pronunciation}
                    etymology=""
                    senses={senses}
                    inflections={inflections}
                    grammarTags={{}}
                    isBookmarked={savedWords.has(entry.word)}
                    onSave={(e) => { e?.preventDefault(); e?.stopPropagation(); handleToggleSave(entry) }}
                    pinnedSenseId={pinnedSenseId}
                    displayLocale={displayLocale}
                    compact
                  />
                </div>
              )
            })}
          </div>
          {availableEntries.length > visibleCount && (
            <div className="mx-auto max-w-[600px] md:px-4 mt-4 mb-6">
              <Button
                onClick={() => setVisibleCount((n) => n + LOAD_MORE_STEP)}
                variant="secondary"
                fullWidth
              >
                もっと見る（+{Math.min(LOAD_MORE_STEP, availableEntries.length - visibleCount)}）
              </Button>
            </div>
          )}
        </section>
      )}

      {selectedEntry && (
        <WordDetailModal
          word={selectedEntry.word}
          dictionary={selectedEntry.dictionary}
          initialPinnedSenseId={selectedEntry.pinned_sense_id}
          displayLocale={displayLocale}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  )
}
