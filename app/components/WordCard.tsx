"use client"

import { useEffect, useState } from "react"
import CreatableSelect from "react-select/creatable"
import type { WordInfo } from "@/types/WordInfo"
import { POS_LABEL_JA } from "@/lib/pos"

type TagOption = { label: string; value: string }

type Props = {
  /** sense 単位のデータのみ渡す */
  word: WordInfo

  /** sense index（必須） */
  senseIndex: number

  /* タグ編集 */
  isEditing?: boolean
  onFinishEdit?: (tags: string[]) => void
  allTags?: string[]
}

export default function WordCard({
  word,
  senseIndex,
  isEditing,
  onFinishEdit,
  allTags = [],
}: Props) {
  if (!word) return null

  const canEditTags = Boolean(word.saved_id)

  const [localTags, setLocalTags] = useState<TagOption[]>(
    word.tags?.map((t) => ({ label: t, value: t })) ?? []
  )

  useEffect(() => {
    setLocalTags(word.tags?.map((t) => ({ label: t, value: t })) ?? [])
  }, [word.tags])

  const displayTags = localTags.map((t) => t.value)

  return (
    <>
      {/* ================= SENSE HEADER ================= */}
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
    </>
  )
}
