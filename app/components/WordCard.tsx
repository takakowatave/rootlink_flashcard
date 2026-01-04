"use client"

// ==============================
// WordCard.tsx
// ==============================
//
// 単語1件を表示するためのメインカードコンポーネント。
// 検索結果・類義語・反意語・保存済み単語リストなど、
// アプリ内の「単語表示」はすべてこのカードを基準に構成される。
//
// 主な役割：
// - 単語情報（意味・例文・訳・品詞）の表示
// - 発音再生（Web Speech API / 英国英語）
// - ブックマーク（保存 / 解除）の UI
// - タグの表示・編集（保存済み単語のみ）
//
// 設計方針：
// - 表示ロジックは WordCard に集約
// - 保存 / 編集などの「永続化」は親コンポーネントに委譲
// - UI上の状態（編集モードなど）のみを扱う
//

import { useEffect, useMemo, useState } from "react"
import { FaVolumeHigh } from "react-icons/fa6"
import { BsBookmark, BsBookmarkFill } from "react-icons/bs"
import CreatableSelect from "react-select/creatable"
import type { WordInfo } from "@/types/WordInfo"

import Tag from "./Tags"
import { normalizePOS, POS_LABEL_JA } from "@/lib/pos"

type TagOption = { label: string; value: string }

type Props = {
  word: WordInfo // 表示対象の単語データ
  savedWords: string[] // 保存済み単語一覧（UI判定用）
  onSave?: (word: WordInfo) => void // ブックマーク切り替え
  label?: "main" | "synonym" | "antonym" // 単語の役割ラベル
  isEditing?: boolean // タグ編集モードかどうか
  onEdit?: () => void // 編集開始
  onFinishEdit?: (tags: string[]) => void // 編集完了（親へ通知）
  allTags?: string[] // タグ候補（サジェスト用）
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
  // 保存済みかどうか（UI判定）
  const isBookmarked = savedWords.includes(word.word)

  // saved_id がある単語のみタグ編集可能（あなたの仕様）
  const canEditTags = Boolean(word.saved_id)

  // 品詞の正規化（あなたのposユーティリティ前提）
  const posList = useMemo(() => normalizePOS(word.partOfSpeech ?? []), [word.partOfSpeech])

  // タグ編集用ローカル state（UI表示のため）
  const [localTags, setLocalTags] = useState<TagOption[]>(
    word.tags?.map((t) => ({ label: t, value: t })) ?? []
  )

  // 親から渡されるtagsが変わったら同期
  useEffect(() => {
    setLocalTags(word.tags?.map((t) => ({ label: t, value: t })) ?? [])
  }, [word.tags])

  // 空データ防御
  if (!word?.word) return null

  // 画面表示用（value文字列配列）
  const displayTags = localTags.map((t) => t.value)

  // -----------------------------------------
  // タグ変更バリデーション
  // - 最大数
  // - 重複禁止
  // - 文字数制限
  // -----------------------------------------
  const handleTagChange = (newValue: readonly TagOption[]) => {
    if (newValue.length > MAX_TAGS) {
      alert(`タグは最大 ${MAX_TAGS} 個までです`)
      return
    }

    const values = newValue.map((t) => t.value.trim())
    if (values.length !== new Set(values).size) {
      alert("同じタグは複数追加できません")
      return
    }

    const tooLong = newValue.find((t) => t.value.length > MAX_TAG_LENGTH)
    if (tooLong) {
      alert(`タグは30文字以内です：${tooLong.value}`)
      return
    }

    setLocalTags([...newValue])
  }

  // -----------------------------------------
  // 発音再生（英国英語）
  // -----------------------------------------
  const speak = (text: string) => {
    if (!text) return

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "en-GB"
    utter.rate = 0.9

    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  return (
    <div className="flex w-full relative">
      <div className="mb-2 md:mb-4 flex items-center w-full bg-white md:bg-gray-100">
        <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full border md:border-0">

          {/* =========================
              HEADER
             ========================= */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-2">
              {/* synonym / antonym ラベル */}
              {label && label !== "main" && (
                <Tag type={label} data-testid={`tag-${label}`} />
              )}

              <h2 className="text-2xl font-bold">{word.word}</h2>

              {/* 発音ボタン */}
              <button
                onClick={() => speak(word.word)}
                className="text-gray-500 hover:text-gray-600 transition-colors"
                aria-label="pronounce word"
                type="button"
              >
                <FaVolumeHigh size={22} />
              </button>
            </div>

            {/* ブックマーク */}
            <button
              onClick={() => onSave?.(word)}
              disabled={!isBookmarked && savedWords.length >= 500}
              className="text-blue-500 hover:text-blue-900 transition-colors"
              aria-label="save word"
              type="button"
            >
              {isBookmarked ? <BsBookmarkFill size={22} /> : <BsBookmark size={22} />}
            </button>
          </div>

          {/* =========================
              PRONUNCIATION（発音記号）
             ========================= */}
          {word.pronunciation && (
            <p className="text-sm text-gray-500 mt-1">
              {word.pronunciation}
            </p>
          )}

          {/* =========================
              POS（品詞）
             ========================= */}
          {posList.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {posList.map((pos) => (
                <span
                  key={pos}
                  className="text-xs bg-gray-100 border rounded-full px-2 py-1 text-gray-700"
                >
                  {POS_LABEL_JA[pos] ?? pos}
                </span>
              ))}
            </div>
          )}

          {/* =========================
              MEANING（意味）
             ========================= */}
          <div className="mt-4">
            {word.meaning ? (
              <p className="text-gray-900 text-base leading-relaxed">
                {word.meaning}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                （このカードはまだ詳細がありません）
              </p>
            )}
          </div>

          {/* =========================
              EXAMPLE（例文） + TRANSLATION（和訳）
             ========================= */}
          {(word.example || word.translation) && (
            <div className="mt-4 border-t pt-4">
              {word.example && (
                <p className="text-gray-800 italic leading-relaxed">
                  {word.example}
                </p>
              )}
              {word.translation && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {word.translation}
                </p>
              )}
            </div>
          )}

          {/* =========================
              TAGS（表示 / 編集）
             ========================= */}
          <div className="mt-5">
            {/* 保存済みで、編集できる場合だけUIを出す */}
            {canEditTags ? (
              <>
                {/* 編集モード */}
                {isEditing ? (
                  <div className="space-y-2">
                    <CreatableSelect
                      isMulti
                      value={localTags}
                      onChange={(v) => handleTagChange(v)}
                      options={allTags.map((t) => ({ label: t, value: t }))}
                      placeholder="タグを追加（最大10個）"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                        onClick={() => onFinishEdit?.(displayTags)}
                      >
                        完了
                      </button>
                      <button
                        type="button"
                        className="px-3 py-2 rounded bg-gray-200 text-gray-800 text-sm"
                        onClick={() => onFinishEdit?.(displayTags)}
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 通常表示（タグ表示 + 編集ボタン）
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {displayTags.length > 0 ? (
                        displayTags.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-blue-50 border border-blue-200 rounded-full px-2 py-1 text-blue-700"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">
                          タグなし
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={onEdit}
                    >
                      編集
                    </button>
                  </div>
                )}
              </>
            ) : (
              // 保存されていない単語はタグUIを出さない（あなたの仕様）
              null
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
