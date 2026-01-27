"use client"

import { useEffect, useState } from "react"
import { FaVolumeHigh } from "react-icons/fa6"
import { BsBookmark, BsBookmarkFill } from "react-icons/bs"
import CreatableSelect from "react-select/creatable"
import type { WordInfo } from "@/types/WordInfo"

import { POS_LABEL_JA } from "@/lib/pos"

type TagOption = { label: string; value: string }

type Props = {
  word: WordInfo
  savedWords: string[]
  onSave?: (word: WordInfo) => void

  /* 👇 sense 用 */
  isFirst?: boolean
  senseIndex?: number

  /* 既存 */
  isEditing?: boolean
  onFinishEdit?: (tags: string[]) => void
  allTags?: string[]
}

export default function WordCard({
  word,
  savedWords,
  onSave,
  isFirst = false,
  senseIndex,
  isEditing,
  onFinishEdit,
  allTags = [],
}: Props) {
  if (!word?.word) return null

  const isBookmarked = savedWords.includes(word.word)
  const canEditTags = Boolean(word.saved_id)

  const [localTags, setLocalTags] = useState<TagOption[]>(
    word.tags?.map((t) => ({ label: t, value: t })) ?? []
  )

  useEffect(() => {
    setLocalTags(word.tags?.map((t) => ({ label: t, value: t })) ?? [])
  }, [word.tags])

  const displayTags = localTags.map((t) => t.value)

  const speak = (text: string) => {
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "en-GB"
    utter.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  const hasEtymology = Boolean(word.etymologyHook?.text)

  return (
    <div className="mb-4 w-full bg-white md:bg-gray-100">
      <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full">

        {/* ================= HEADER ================= */}
        {isFirst && (
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{word.word}</h2>
              <button onClick={() => speak(word.word)}>
                <FaVolumeHigh size={20} />
              </button>
            </div>

            <button
              onClick={() => onSave?.(word)}
              disabled={!isBookmarked && savedWords.length >= 500}
            >
              {isBookmarked ? <BsBookmarkFill /> : <BsBookmark />}
            </button>
          </div>
        )}

        {/* ================= PRONUNCIATION ================= */}
        {isFirst && word.pronunciation && (
          <p className="text-sm text-gray-500 mt-1">
            {word.pronunciation}
          </p>
        )}

        {/* ================= SENSE HEADER ================= */}
        {typeof senseIndex === "number" && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">
              意味 {senseIndex + 1}
            </span>

            {word.partOfSpeech?.map((pos) => (
              <span
                key={pos}
                className="text-xs bg-gray-100 border rounded-full px-2 py-0.5"
              >
                {POS_LABEL_JA[pos]}
              </span>
            ))}
          </div>
        )}

        {/* ================= MEANING ================= */}
        {word.meaning && (
          <div className="mt-2">
            <p>{word.meaning}</p>
          </div>
        )}

        {/* ================= EXAMPLE ================= */}
        {(word.example || word.translation) && (
          <div className="mt-4 border-t pt-4">
            {word.example && <p className="italic">{word.example}</p>}
            {word.translation && (
              <p className="text-sm text-gray-600 mt-2">
                {word.translation}
              </p>
            )}
          </div>
        )}

        {/* ================= 🔑 ETYMOLOGY HOOK ================= */}
        {isFirst && hasEtymology && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <span className="text-xs font-bold text-green-700">
              語源フック
            </span>
            <p className="mt-2 text-green-900">
              {word.etymologyHook!.text}
            </p>
          </div>
        )}

        {/* ================= TAGS ================= */}
        {canEditTags && (
          <div className="mt-6">
            {isEditing ? (
              <>
                <CreatableSelect
                  isMulti
                  value={localTags}
                  onChange={(v) => setLocalTags([...v])}
                  options={allTags.map((t) => ({ label: t, value: t }))}
                />
                <button
                  className="mt-2 text-sm text-blue-600"
                  onClick={() => onFinishEdit?.(displayTags)}
                >
                  完了
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayTags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-blue-50 px-2 py-1 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
