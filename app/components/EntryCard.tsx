"use client"

import { ReactNode } from "react"
import { FaVolumeHigh } from "react-icons/fa6"
import { BsBookmark, BsBookmarkFill } from "react-icons/bs"

type Pronunciation = {
  lang: "en-US" | "en-GB"
}

type EntryCardProps = {
  headword: string
  isBookmarked: boolean
  isSaveDisabled?: boolean

  /** ★ 共通検索フォーム（単語・熟語共通） */
  searchForm?: ReactNode

  onSave?: () => void
  pronunciation?: Pronunciation
  children: ReactNode
}

export default function EntryCard({
  headword,
  isBookmarked,
  isSaveDisabled = false,
  searchForm,
  onSave,
  pronunciation,
  children,
}: EntryCardProps) {
  const speak = () => {
    if (!pronunciation) return
    const utter = new SpeechSynthesisUtterance(headword)
    utter.lang = pronunciation.lang
    utter.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  return (
    <div className="mb-4 w-full bg-white md:bg-gray-100">
      <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full">

        {/* ===== 共通検索フォーム（Figmaどおりカード上部） ===== */}
        {searchForm && (
          <div className="mb-4">
            {searchForm}
          </div>
        )}

        {/* ================= HEADER ================= */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{headword}</h2>

            {pronunciation && (
              <button onClick={speak} aria-label="Play pronunciation">
                <FaVolumeHigh size={20} />
              </button>
            )}
          </div>

          <button onClick={onSave} disabled={isSaveDisabled}>
            {isBookmarked ? <BsBookmarkFill /> : <BsBookmark />}
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        {children}

      </div>
    </div>
  )
}
