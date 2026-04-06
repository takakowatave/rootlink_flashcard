'use client'

import { useState, useEffect } from "react"
import EntryCard from "@/components/EntryCard"
import WordPageClient from "@/components/WordPageClient"
import { fetchWordlists, toggleSaveStatus } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import { BsX } from "react-icons/bs"

export type SavedWordRow = {
  word_id: string
  word: string
  saved_id?: string
  dictionary?: any
  pinned_sense_id?: string | null
}

function buildPronunciation(dictionary: any) {
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

function buildSenses(dictionary: any): Record<string, { senseId: string; meaning: string; example?: string; exampleTranslation?: string }[]> {
  const senseGroups: any[] = dictionary?.senseGroups ?? []
  const jaLocales: Record<string, any> = dictionary?.locales?.ja?.senses ?? {}

  const result: Record<string, any[]> = {}

  for (const group of senseGroups) {
    const pos = String(group.partOfSpeech ?? '').toLowerCase()
    if (!pos) continue

    const senses = (group.senses ?? [])
      .map((sense: any) => {
        const senseId = String(sense.senseId ?? '')
        const ja = jaLocales[senseId]
        return {
          senseId,
          meaning: ja?.meaning ?? sense.definition ?? '',
          example: sense.example ?? undefined,
          exampleTranslation: ja?.exampleTranslation ?? undefined,
        }
      })
      .filter((s: any) => s.senseId && s.meaning)

    if (senses.length > 0) result[pos] = senses
  }

  return result
}

export default function WordListPage() {
  const [wordList, setWordList] = useState<SavedWordRow[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<SavedWordRow | null>(null)

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

  const handleToggleSave = async (word: SavedWordRow) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { toast.error("ログインが必要です"); return }

    const result = await toggleSaveStatus(word)
    if (!result.success) { toast.error("処理に失敗しました"); return }

    await load()
    toast.success("更新しました")
  }

  const handleCardClick = (item: SavedWordRow) => {
    setSelectedItem(item)
  }

  const handleClosePanel = () => {
    setSelectedItem(null)
    // パネルを閉じたらリストを再取得して pinned_sense_id を最新化
    load()
  }

  const panelOpen = selectedItem !== null

  return (
    <>
      <Toaster position="top-center" />
      <div className="flex items-start">

        {/* ===== Left: compact word list ===== */}
        <div className={`transition-all duration-300 ${panelOpen ? 'hidden md:block md:w-72 lg:w-80 md:border-r md:border-gray-200 flex-shrink-0' : 'w-full'}`}>
          {[...wordList].reverse().map((item) => {
            const d = item.dictionary
            const pronunciation = buildPronunciation(d)
            const senses = buildSenses(d)
            const inflections: string[] = d?.inflections ?? []
            const allSenses = Object.values(senses).flat()
            const firstSenseId = allSenses[0]?.senseId ?? null
            const pinnedSenseId = item.pinned_sense_id ?? firstSenseId
            const isSelected = selectedItem?.saved_id === item.saved_id

            return (
              <div
                key={item.saved_id ?? item.word_id}
                onClick={() => handleCardClick(item)}
                className={`cursor-pointer border-b border-gray-100 transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
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
                  displayLocale="ja"
                  compact
                />
              </div>
            )
          })}
        </div>

        {/* ===== Right: detail panel (desktop) ===== */}
        {panelOpen && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10">
              <span className="text-sm text-gray-500 font-medium">{selectedItem.word}</span>
              <button
                onClick={handleClosePanel}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="閉じる"
              >
                <BsX size={20} />
              </button>
            </div>

            {/* Detail content */}
            <div className="flex-1 p-4">
              <WordPageClient
                word={selectedItem.word}
                dictionary={selectedItem.dictionary}
                savedId={selectedItem.saved_id}
                initialPinnedSenseId={selectedItem.pinned_sense_id}
              />
            </div>
          </div>
        )}

        {/* Mobile: panel overlays full screen */}
        {panelOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 sticky top-0">
              <span className="text-sm text-gray-500 font-medium">{selectedItem.word}</span>
              <button
                onClick={handleClosePanel}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="閉じる"
              >
                <BsX size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <WordPageClient
                word={selectedItem.word}
                dictionary={selectedItem.dictionary}
                savedId={selectedItem.saved_id}
                initialPinnedSenseId={selectedItem.pinned_sense_id}
              />
            </div>
          </div>
        )}

      </div>
    </>
  )
}
