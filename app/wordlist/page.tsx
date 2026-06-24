'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import EntryCard from "@/components/EntryCard"
import Button from "@/components/Button"
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

type DisplaySense = { senseId: string; meaning: string; example?: string; exampleTranslation?: string }

function buildPronunciation(dictionary: SavedWordDictionary | null | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
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
        return {
          senseId,
          meaning,
          example: sense.example ?? undefined,
          exampleTranslation: ja?.exampleTranslation ?? undefined,
        }
      })
      .filter((s) => s.senseId && s.meaning)

    if (senses.length > 0) result[pos] = senses
  }

  return result
}

export default function WordListPage() {
  const [wordList, setWordList] = useState<SavedWordRow[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
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
    setSavedWords(words.map((w) => w.word))
    setStreak(streakInfo)
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

      {/* ===== Streak ===== */}
      {streak && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center">
          <StreakBadge streak={streak.current_streak} longest={streak.longest_streak} />
        </div>
      )}

      {/* ===== Quiz / Deck CTA ===== */}
      <div className="px-4 py-2 border-b border-gray-100 flex justify-end gap-2">
        <Link href="/decks">
          <Button variant="secondary" size="sm">デッキ</Button>
        </Link>
        {wordList.length > 0 && (
          <Link href="/quiz">
            <Button variant="secondary" size="sm">復習する</Button>
          </Link>
        )}
      </div>

      {/* ===== Word list ===== */}
      <div className="w-full overflow-x-hidden flex flex-col gap-3 px-3 py-3">
        {wordList.map((item) => {
          const d = item.dictionary
          const pronunciation = buildPronunciation(d)
          const senses = buildSenses(d, displayLocale)
          const inflections: string[] = d?.inflections ?? []
          const allSenses = Object.values(senses).flat()
          const firstSenseId = allSenses[0]?.senseId ?? null
          const pinnedSenseId = item.pinned_sense_id ?? firstSenseId

          return (
            <div
              key={item.saved_id ?? item.word_id}
              onClick={() => handleOpenModal(item)}
              className="group cursor-pointer"
            >
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

      {/* ===== Detail modal ===== */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden"
          onClick={handleCloseModal}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Panel */}
          <div
            className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl h-[90dvh] flex flex-col shadow-xl overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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

            {/* Content */}
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
