"use client"

/**
 * SenceCard.tsx
 *
 * 【責務】
 * - word の 1 sense だけを表示する UI コンポーネント
 * - EntryCard 配下で、meaning / patterns / example / tags を表示する
 *
 * 【このコンポーネントでやること】
 * - sense 見出しとして pattern を表示する
 * - meaning を 1回だけ表示する
 * - usage 補助として patterns を表示する
 * - example を表示する
 * - saved_id がある場合だけ tags 編集 UI を表示する
 *
 * 【このコンポーネントでやらないこと】
 * - word 全体のレイアウトを持たない
 * - lexicalUnit 専用カードとしては使わない
 * - 語源・発音・ブックマークなど word レベル情報は扱わない
 * - 現在の英英モードでは translation は表示しない
 *
 * 【補足】
 * - translation / partOfSpeech / senseIndex は将来拡張用に型だけ残している
 * - 現在の描画では未使用
 */

import { useEffect, useState } from "react"
import CreatableSelect from "react-select/creatable"
import type { PartOfSpeech } from "@/types/WordInfo"

type TagOption = { label: string; value: string }

type SenseInfo = {
  // 見出し用の構文やパターン
  pattern?: string

  // 意味本文
  meaning: string

  // 例文
  example?: string

  // 将来の英和表示用。現状の英英モードでは描画しない
  translation?: string

  // 将来拡張用。現状の描画では未使用
  partOfSpeech?: PartOfSpeech[]

  // 保存済み sense の場合だけ tag 編集を許可する
  saved_id?: string

  // 既存タグ
  tags?: string[]

  // usage / grammar 補助ラベル
  patterns?: string[]
}

type Props = {
  sense: SenseInfo

  // 将来の並び番号表示などに使う余地を残す
  senseIndex: number

  isEditing?: boolean
  onFinishEdit?: (tags: string[]) => void
  allTags?: string[]
}

export default function SenseCard({
  sense,
  senseIndex,
  isEditing,
  onFinishEdit,
  allTags = [],
}: Props) {
  if (!sense) return null

  // 現在は未使用だが、Props 互換維持のため受け取る
  void senseIndex

  // saved_id があるものだけ tag 編集 UI を出す
  const canEditTags = Boolean(sense.saved_id)

  // react-select 用のローカル状態
  const [localTags, setLocalTags] = useState<TagOption[]>(
    sense.tags?.map((tag) => ({ label: tag, value: tag })) ?? []
  )

  // 外から tags が変わったらローカル状態も同期
  useEffect(() => {
    setLocalTags(
      sense.tags?.map((tag) => ({ label: tag, value: tag })) ?? []
    )
  }, [sense.tags])

  const displayTags = localTags.map((tag) => tag.value)

  return (
    <>
      {/* ================= HEADER ================= */}
      {sense.pattern && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xl font-semibold text-gray-900">
            {sense.pattern}
          </span>
        </div>
      )}

      {/* ================= MEANING ================= */}
      {sense.meaning && (
        <div className="mt-2">
          <p className="text-gray-900">{sense.meaning}</p>
        </div>
      )}

      {/* ================= PATTERNS ================= */}
      {sense.patterns && sense.patterns.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {sense.patterns.map((pattern) => (
            <span
              key={pattern}
              className="text-xs rounded bg-gray-100 px-2 py-1"
            >
              {pattern}
            </span>
          ))}
        </div>
      )}

      {/* ================= EXAMPLE ================= */}
      {sense.example && (
        <div className="mt-4 pt-4">
          <p className="italic text-gray-700">{sense.example}</p>
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
                onChange={(value) => setLocalTags([...value])}
                options={allTags.map((tag) => ({
                  label: tag,
                  value: tag,
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
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-blue-50 px-2 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}