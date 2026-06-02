'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import EntryCard from "@/components/EntryCard"
import WordPageClient from "@/components/WordPageClient"
import { fetchWordlists, toggleSaveStatus } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import { BsX, BsArrowUpRightSquare } from "react-icons/bs"
import type { SavedWordDictionary, SavedWordSenseGroup } from "@/types/Dictionary"
import type { DisplayLocale } from "@/types/DisplayLocale"
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from "@/types/DisplayLocale"

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
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  const load = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    const words = await fetchWordlists(data.user.id)
    setWordList(words)
    setSavedWords(words.map((w) => w.word))
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
    setSelectedItem(null)
    load()
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* ===== Quiz CTA ===== */}
      {wordList.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 flex justify-end">
          <Link href="/quiz">
            <button className="h-7 px-4 rounded-full border border-[#00AD82] text-[#00AD82] text-xs font-medium hover:bg-[#f0fdf9] transition-colors">
              復習する
            </button>
          </Link>
        </div>
      )}

      {/* ===== Word list ===== */}
      <div className="w-full">
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
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleCloseModal}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Panel */}
          <div
            className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-1">
                <a
                  href={`/word/${selectedItem.word}`}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                  aria-label="単語ページへ"
                >
                  <BsArrowUpRightSquare size={18} />
                </a>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                  aria-label="閉じる"
                >
                  <BsX size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
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
