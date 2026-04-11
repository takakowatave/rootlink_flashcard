'use client'

import { useState, useEffect } from "react"
import EntryCard from "@/components/EntryCard"
import WordPageClient from "@/components/WordPageClient"
import { fetchWordlists, toggleSaveStatus } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"
import { BsX } from "react-icons/bs"
import type { SavedWordDictionary, SavedWordSenseGroup } from "@/types/Dictionary"

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

function buildSenses(dictionary: SavedWordDictionary | null | undefined): Record<string, DisplaySense[]> {
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
        return {
          senseId,
          meaning: ja?.meaning ?? sense.definition ?? '',
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

  const handleCloseModal = () => {
    setSelectedItem(null)
    load()
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* ===== Word list ===== */}
      <div className="w-full">
        {[...wordList].reverse().map((item) => {
          const d = item.dictionary
          const pronunciation = buildPronunciation(d)
          const senses = buildSenses(d)
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
                displayLocale="ja"
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
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <span className="font-semibold text-gray-700">{selectedItem.word}</span>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
                aria-label="閉じる"
              >
                <BsX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4">
              <WordPageClient
                word={selectedItem.word}
                dictionary={selectedItem.dictionary}
                savedId={selectedItem.saved_id}
                initialPinnedSenseId={selectedItem.pinned_sense_id}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
