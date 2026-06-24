'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import WordPageClient from "@/components/WordPageClient"
import { fetchWordlists, toggleSaveStatus, updateStreak } from "@/lib/supabaseApi"
import type { StreakInfo } from "@/lib/supabaseApi"
import StreakBadge from "@/components/StreakBadge"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import { BsX, BsArrowUpRightSquare } from "react-icons/bs"
import type { SavedWordDictionary, SavedWordSenseGroup } from "@/types/Dictionary"
import type { DisplayLocale } from "@/types/DisplayLocale"
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale"
import SignupRequiredModal from "@/components/SignupRequiredModal"

export type SavedWordRow = {
  word_id: string
  word: string
  saved_id?: string
  dictionary?: SavedWordDictionary | null
  pinned_sense_id?: string | null
}

function getFirstMeaning(dictionary: SavedWordDictionary | null | undefined, locale: DisplayLocale): string {
  const senseGroups: SavedWordSenseGroup[] = dictionary?.senseGroups ?? []
  const jaLocales = dictionary?.locales?.ja?.senses ?? {}
  for (const group of senseGroups) {
    for (const sense of group.senses ?? []) {
      const senseId = String(sense.senseId ?? '')
      const ja = jaLocales[senseId]
      const meaning = locale === 'ja'
        ? (ja?.meaning ?? sense.definition ?? '')
        : (sense.definition ?? ja?.meaning ?? '')
      if (meaning) return meaning
    }
  }
  return ''
}

function DonutChart({ total, available }: { total: number; available: number }) {
  if (total === 0) return null
  const pct = available / total
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = pct * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke="#3b82f6" strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2937">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span className="text-[11px] text-gray-400">辞書あり</span>
    </div>
  )
}

export default function WordListPage() {
  const [wordList, setWordList] = useState<SavedWordRow[]>([])
  const [selectedItem, setSelectedItem] = useState<SavedWordRow | null>(null)
  const [modalScrolled, setModalScrolled] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const load = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { setShowSignupModal(true); return }
    const [words, streakInfo] = await Promise.all([
      fetchWordlists(data.user.id),
      updateStreak(data.user.id),
    ])
    setWordList(words)
    setStreak(streakInfo)
  }

  useEffect(() => { load() }, [])

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
    if (!item.dictionary) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    setModalScrolled(false)
    setSelectedItem(item)
  }

  const availableCount = wordList.filter(w => !!w.dictionary).length

  return (
    <>
      <Toaster position="top-center" />
      {showSignupModal && <SignupRequiredModal onClose={() => setShowSignupModal(false)} />}

      {/* ===== FAB: SP search ===== */}
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

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ===== Streak + deck link ===== */}
        {streak && (
          <div className="flex items-center justify-between">
            <StreakBadge streak={streak.current_streak} longest={streak.longest_streak} />
            <Link href="/decks" className="text-sm text-blue-500 hover:underline">デッキ一覧 →</Link>
          </div>
        )}

        {/* ===== Deck card ===== */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-medium mb-0.5">マイリスト</p>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">オリジナル単語リスト</h1>
              <p className="text-sm text-gray-500 mt-1">{wordList.length} 語</p>
            </div>
            <DonutChart total={wordList.length} available={availableCount} />
          </div>

          {/* Quiz button */}
          {wordList.length > 0 && (
            <div className="px-5 pb-5">
              <Link href="/quiz">
                <button className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors">
                  クイズを始める
                </button>
              </Link>
            </div>
          )}

          {wordList.length > 0 && <div className="h-px bg-gray-100" />}

          {/* Word list */}
          <ul>
            {wordList.map((item, idx) => {
              const meaning = getFirstMeaning(item.dictionary, displayLocale)
              const hasDict = !!item.dictionary
              return (
                <li
                  key={item.saved_id ?? item.word_id}
                  className={`flex items-center gap-3 px-5 py-3 ${hasDict ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''} transition-colors ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                  onClick={() => handleOpenModal(item)}
                >
                  <span className="text-xs text-gray-300 w-6 text-right flex-shrink-0 tabular-nums">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{item.word}</p>
                    {meaning && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{meaning}</p>
                    )}
                  </div>
                  {hasDict && (
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </li>
              )
            })}
          </ul>

          {wordList.length === 0 && (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">
              単語を検索して保存してみましょう
            </div>
          )}
        </div>
      </div>

      {/* ===== Detail modal ===== */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl h-[90dvh] flex flex-col shadow-xl overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <span className={`text-base font-semibold text-gray-800 transition-opacity duration-150 ${modalScrolled ? 'opacity-100' : 'opacity-0'}`}>{selectedItem.word}</span>
              <div className="flex items-center gap-1">
                <a
                  href={`/word/${selectedItem.word}`}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                  aria-label="単語ページへ"
                >
                  <BsArrowUpRightSquare size={24} />
                </a>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                  aria-label="閉じる"
                >
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
