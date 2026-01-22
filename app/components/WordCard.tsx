"use client"

import { useEffect, useMemo, useState } from "react"
import { FaVolumeHigh } from "react-icons/fa6"
import { BsBookmark, BsBookmarkFill } from "react-icons/bs"
import CreatableSelect from "react-select/creatable"
import type { WordInfo } from "@/types/WordInfo"

import Tag from "./Tags"
import { normalizePOS, POS_LABEL_JA } from "@/lib/pos"

type TagOption = { label: string; value: string }

type Props = {
  word: WordInfo
  savedWords: string[]
  onSave?: (word: WordInfo) => void
  label?: "main" | "synonym" | "antonym"
  isEditing?: boolean
  onEdit?: () => void
  onFinishEdit?: (tags: string[]) => void
  allTags?: string[]
}

const MAX_TAGS = 10
const MAX_TAG_LENGTH = 30

export default function WordCard({
  word,
  savedWords,
  onSave,
  label,
  isEditing,
  onEdit,
  onFinishEdit,
  allTags = [],
}: Props) {
  const isBookmarked = savedWords.includes(word.word)
  const canEditTags = Boolean(word.saved_id)

  const posList = useMemo(
    () => normalizePOS(word.partOfSpeech ?? []),
    [word.partOfSpeech]
  )

  const [localTags, setLocalTags] = useState<TagOption[]>(
    word.tags?.map((t) => ({ label: t, value: t })) ?? []
  )

  useEffect(() => {
    setLocalTags(word.tags?.map((t) => ({ label: t, value: t })) ?? [])
  }, [word.tags])

  if (!word?.word) return null

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
  const hasDerived = (word.derivedWords?.length ?? 0) > 0

  return (
    <div className="mb-4 w-full bg-white md:bg-gray-100">
      <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full">

        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            {label && label !== "main" && <Tag type={label} />}
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

        {/* ================= PRONUNCIATION ================= */}
        {word.pronunciation && (
          <p className="text-sm text-gray-500 mt-1">
            {word.pronunciation}
          </p>
        )}

        {/* ================= POS ================= */}
        {posList.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {posList.map((pos) => (
              <span
                key={pos}
                className="text-xs bg-gray-100 border rounded-full px-2 py-1"
              >
                {POS_LABEL_JA[pos]}
              </span>
            ))}
          </div>
        )}

        {/* ================= MEANING ================= */}
        <div className="mt-4">
          {word.meaning ? (
            <p>{word.meaning}</p>
          ) : (
            <p className="text-gray-400 text-sm">
              （このカードはまだ詳細がありません）
            </p>
          )}
        </div>

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
        {hasEtymology && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <span className="text-xs font-bold text-green-700">
              語源フック
            </span>
            <p className="mt-2 text-green-900">
              {word.etymologyHook!.text}
            </p>
          </div>
        )}

        {/* ================= DERIVED WORDS ================= */}
        {!hasEtymology && hasDerived && (
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-700 mb-2">
              関連語（語源なし）
            </p>
            <div className="space-y-2">
              {word.derivedWords!.map((w) => (
                <WordCard
                  key={w.word}
                  word={w}
                  savedWords={savedWords}
                  onSave={onSave}
                />
              ))}
            </div>
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
                <button onClick={() => onFinishEdit?.(displayTags)}>
                  完了
                </button>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayTags.map((t) => (
                  <span key={t} className="text-xs bg-blue-50 px-2 py-1 rounded">
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
