"use client"

/**
 * WordCard.tsx
 *
 * 【責務】
 * - 単語の「1つの意味（sense）」のみを表示するUIコンポーネント
 * - EntryCard（単語レベルUI）の子として使用される
 * - Oxfordから抽出されたsenseデータを描画する
 *
 * 【設計方針】
 * - 単語レベル情報（語源・発音・ブックマーク）は扱わない
 * - ここは「意味ブロック専用」
 * - WordInfo全体型は使用しない（過剰なため）
 *
 * 【重要】
 * partOfSpeechはstringではなく PartOfSpeech 型を使用する
 * → POS_LABEL_JAとの整合性を保つため
 */

import { useEffect, useState } from "react"
import CreatableSelect from "react-select/creatable"
import { POS_LABEL_JA } from "@/lib/pos"
import type { PartOfSpeech } from "@/types/WordInfo"

type TagOption = { label: string; value: string }

/**
 * Sense単位の最小構造
 * Oxford → WordPageClient → WordCard に渡される
 */
type SenseInfo = {
  meaning: string
  example?: string
  translation?: string
  partOfSpeech?: PartOfSpeech[]
  saved_id?: string
  tags?: string[]
}

type Props = {
  /** sense単位のデータのみ受け取る */
  sense: SenseInfo

  /** 表示順用 index */
  senseIndex: number

  /** タグ編集関連 */
  isEditing?: boolean
  onFinishEdit?: (tags: string[]) => void
  allTags?: string[]
}

export default function WordCard({
  sense,
  senseIndex,
  isEditing,
  onFinishEdit,
  allTags = [],
}: Props) {
  if (!sense) return null

  /** 保存済みかどうか */
  const canEditTags = Boolean(sense.saved_id)

  /** ローカルタグ状態 */
  const [localTags, setLocalTags] = useState<TagOption[]>(
    sense.tags?.map((t) => ({ label: t, value: t })) ?? []
  )

  /** sense変更時に同期 */
  useEffect(() => {
    setLocalTags(
      sense.tags?.map((t) => ({ label: t, value: t })) ?? []
    )
  }, [sense.tags])

  const displayTags = localTags.map((t) => t.value)

  return (
    <>
      {/* ================= SENSE HEADER ================= */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-500">
          意味 {senseIndex + 1}
        </span>

        {sense.partOfSpeech?.map((pos) => (
          <span
            key={pos}
            className="text-xs bg-gray-100 border rounded-full px-2 py-0.5"
          >
            {POS_LABEL_JA[pos]}
          </span>
        ))}
      </div>

      {/* ================= MEANING ================= */}
      {sense.meaning && (
        <div className="mt-2">
          <p>{sense.meaning}</p>
        </div>
      )}

      {/* ================= EXAMPLE ================= */}
      {(sense.example || sense.translation) && (
        <div className="mt-4 border-t pt-4">
          {sense.example && (
            <p className="italic">{sense.example}</p>
          )}
          {sense.translation && (
            <p className="text-sm text-gray-600 mt-2">
              {sense.translation}
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
                options={allTags.map((t) => ({
                  label: t,
                  value: t,
                }))}
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