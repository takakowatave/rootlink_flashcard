'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import EntryCard from "@/components/EntryCard"
import WordPageClient from "@/components/WordPageClient"
import Button from "@/components/Button"
import TriDonutChart from "@/components/TriDonutChart"
import QuizSession, { buildQuizCards, shuffleCards } from "@/components/QuizSession"
import type { QuizEntry } from "@/components/QuizSession"
import { fetchWordlists, toggleSaveStatus, updateStreak, saveQuizResult } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import { BsX, BsArrowUpRightSquare } from "react-icons/bs"
import type { SavedWordDictionary, SavedWordSenseGroup } from "@/types/Dictionary"
import type { DisplayLocale } from "@/types/DisplayLocale"
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale"
import SignupRequiredModal from "@/components/SignupRequiredModal"

type WordStatus = 'mastered' | 'review' | 'unseen'
type QuizScope = 'random' | 'review'

export type SavedWordRow = {
  word_id: string
  word: string
  saved_id?: string
  dictionary?: SavedWordDictionary | null
  pinned_sense_id?: string | null
}

type DisplaySense = { senseId: string; meaning: string; example?: string; exampleTranslation?: string }

function buildPronunciation(dictionary: SavedWordDictionary | null | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (dictionary?.audio?.audioUrl) {
    return {
      phoneticSpelling: dictionary.ipa ?? undefined,
      audioFile: dictionary.audio.audioUrl,
    }
  }
  if (dictionary?.audio?.audioPath) {
    return {
      phoneticSpelling: dictionary.ipa ?? undefined,
      audioFile: `${supabaseUrl}/storage/v1/object/public/${dictionary.audio.audioPath}`,
    }
  }
  return {
    phoneticSpelling: dictionary?.ipa ?? undefined,
    audioFile: undefined,
  }
}

function buildSenses(dictionary: SavedWordDictionary | null | undefined, locale: DisplayLocale = 'ja'): Record<string, DisplaySense[]> {
  const senseGroups: SavedWordSenseGroup[] = dictionary?.senseGroups ?? []
  const jaLocales = dictionary?.locales?.ja?.senses ?? {}
  const result: Record<string, DisplaySense[]> = {}

  for (const group of senseGroups) {
    const pos = String(group.partOfSpeech ?? '').toLowerCase()
    if (!pos) continue
    const senses: DisplaySense[] = (group.senses ?? [])
      .map((sense) => {
        const senseId = String(sense.senseId ?? '')
        const ja = jaLocales[senseId]
        const meaning = locale === 'ja'
          ? (ja?.meaning ?? sense.definition ?? '')
          : (sense.definition ?? ja?.meaning ?? '')
        return { senseId, meaning, example: sense.example ?? undefined, exampleTranslation: ja?.exampleTranslation ?? undefined }
      })
      .filter((s) => s.senseId && s.meaning)
    if (senses.length > 0) result[pos] = senses
  }
  return result
}

export default function WordListPage() {
  const router = useRouter()
  const [wordList, setWordList] = useState<SavedWordRow[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<SavedWordRow | null>(null)
  const [modalScrolled, setModalScrolled] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [wordStatus, setWordStatus] = useState<Map<string, WordStatus>>(new Map())
  const [quizEntries, setQuizEntries] = useState<QuizEntry[] | null>(null)
  const [quizScope, setQuizScope] = useState<QuizScope>('random')
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const loadStatus = async (words: SavedWordRow[], userId: string) => {
    const wordNames = words.map((w) => w.word)
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('word, correct, created_at')
      .eq('user_id', userId)
      .in('word', wordNames)
      .order('created_at', { ascending: false })
      .limit(10000)

    const latestByWord = new Map<string, boolean>()
    for (const row of ((qr ?? []) as { word: string; correct: boolean }[])) {
      if (!latestByWord.has(row.word)) latestByWord.set(row.word, row.correct)
    }
    const statusMap = new Map<string, WordStatus>()
    for (const w of words) {
      const latest = latestByWord.get(w.word)
      statusMap.set(w.word, latest === undefined ? 'unseen' : latest ? 'mastered' : 'review')
    }
    setWordStatus(statusMap)
  }

  const load = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); return }
    const [words] = await Promise.all([
      fetchWordlists(data.user.id),
      updateStreak(data.user.id),
    ])
    setWordList(words)
    setSavedWords(words.map((w) => w.word))
    if (words.length > 0) await loadStatus(words, data.user.id)
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  const handleToggleSave = async (word: SavedWordRow) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { toast.error("ログインが必要です"); return }
    const result = await toggleSaveStatus(word)
    if (!result.success) { toast.error("処理に失敗しました"); return }
    await load()
    toast.success("更新しました")
  }

  const handleCloseModal = () => {
    const scrollY = parseInt(document.body.style.top || '0') * -1
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollY)
    setSelectedItem(null)
    load()
  }

  const handleOpenModal = (item: SavedWordRow) => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    setModalScrolled(false)
    setSelectedItem(item)
  }

  const availableCount = wordList.filter((w) => !!w.dictionary).length
  const masteredCount = [...wordStatus.values()].filter((s) => s === 'mastered').length
  const reviewCount = [...wordStatus.values()].filter((s) => s === 'review').length
  const unseenCount = wordList.length - masteredCount - reviewCount
  const reviewWords = wordList.filter((w) => wordStatus.get(w.word) === 'review' && !!w.dictionary)

  const toQuizEntry = (w: SavedWordRow): QuizEntry => ({
    word: w.word,
    dictionary: w.dictionary ?? null,
    pinned_sense_id: w.pinned_sense_id ?? null,
  })

  const startQuiz = () => {
    const source = quizScope === 'review' ? reviewWords : wordList
    const sourceEntries = source.map(toQuizEntry)
    const cards = shuffleCards(buildQuizCards(sourceEntries)).slice(0, 10)
    const sessionEntries: QuizEntry[] = cards.map(
      (c) => sourceEntries.find((e) => e.word === c.word) ?? { word: c.word, dictionary: null }
    )
    setQuizEntries(sessionEntries)
  }

  const handleQuizAnswer = async (word: string, correct: boolean) => {
    await saveQuizResult(word, correct)
    setWordStatus((prev) => new Map(prev).set(word, correct ? 'mastered' : 'review'))
  }

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
      <Toaster position="top-center" />
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}

      {!selectedItem && (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-mobile-search'))}
          className="md:hidden fixed bottom-6 right-3 z-40 size-[60px] rounded-full bg-secondary flex items-center justify-center shadow-[0px_4px_14px_rgba(106,120,128,0.6)]"
          aria-label="Search"
        >
          <svg className="size-[28px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}

      <div className="max-w-[568px] mx-auto w-full">
      {/* ── 進捗＋クイズ ── */}
      {wordList.length > 0 && (
        <section className="pt-6 px-4">
          <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
            <div className="flex justify-center py-2">
              <TriDonutChart mastered={masteredCount} review={reviewCount} unseen={unseenCount} />
            </div>

            {availableCount > 0 && (
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

          <Button
            onClick={startQuiz}
            disabled={availableCount === 0 || (quizScope === 'review' && reviewWords.length === 0)}
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4"
          >
            {availableCount === 0 ? '単語データがまだありません' : 'クイズを始める'}
          </Button>
        </section>
      )}

      {/* ── オリジナル単語リスト ── */}
      <section className="pt-6">
        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            オリジナル単語リスト
            <span className="text-muted ml-1">›</span>
          </h2>
          <span className="text-sm text-muted">{wordList.length}語</span>
        </div>

        {wordList.length === 0 ? (
          <p className="px-4 text-sm text-muted">単語を検索して保存してみましょう</p>
        ) : (
          <div className="flex flex-col gap-3 px-3">
            {wordList.map((item) => {
              const d = item.dictionary
              const pronunciation = buildPronunciation(d)
              const senses = buildSenses(d, displayLocale)
              const inflections: string[] = d?.inflections ?? []
              const allSenses = Object.values(senses).flat()
              const firstSenseId = allSenses[0]?.senseId ?? null
              const pinnedSenseId = item.pinned_sense_id ?? firstSenseId
              return (
                <div key={item.saved_id ?? item.word_id} onClick={() => handleOpenModal(item)} className="cursor-pointer">
                  <EntryCard
                    headword={item.word}
                    pronunciation={pronunciation}
                    etymology=""
                    senses={senses}
                    inflections={inflections}
                    grammarTags={{}}
                    isBookmarked={savedWords.includes(item.word)}
                    onSave={(e) => { e?.preventDefault(); e?.stopPropagation(); handleToggleSave(item) }}
                    pinnedSenseId={pinnedSenseId}
                    displayLocale={displayLocale}
                    compact
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>
      </div>


      {/* Detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden" onClick={handleCloseModal}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl h-[90dvh] flex flex-col shadow-xl overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-line flex-shrink-0">
              <span className={`text-base font-semibold text-gray-800 transition-opacity duration-150 ${modalScrolled ? 'opacity-100' : 'opacity-0'}`}>{selectedItem.word}</span>
              <div className="flex items-center gap-1">
                <a href={`/word/${selectedItem.word}`} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-muted" aria-label="単語ページへ">
                  <BsArrowUpRightSquare size={24} />
                </a>
                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-muted" aria-label="閉じる">
                  <BsX size={24} />
                </button>
              </div>
            </div>
            <div
              className="overflow-y-auto overflow-x-hidden flex-1 w-full pb-8"
              onScroll={(e) => setModalScrolled((e.currentTarget as HTMLDivElement).scrollTop > 40)}
            >
              <WordPageClient
                word={selectedItem.word}
                dictionary={selectedItem.dictionary}
                savedId={selectedItem.saved_id}
                initialPinnedSenseId={selectedItem.pinned_sense_id}
                initialDisplayLocale={displayLocale}
                noCard
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
