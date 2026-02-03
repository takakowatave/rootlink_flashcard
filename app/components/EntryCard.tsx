"use client"

import { ReactNode } from "react"
import { FaVolumeHigh } from "react-icons/fa6"
import { BsBookmark, BsBookmarkFill } from "react-icons/bs"

type EntryCardProps = {
  /** 表示する語（word.word / lexicalUnit.phrase） */
  headword: string

  /** 保存済みかどうか */
  isBookmarked: boolean

  /** 保存上限に達しているか（UI制御用） */
  isSaveDisabled?: boolean

  /** 保存ボタン押下時 */
  onSave?: () => void

  /** 中身（Word / LexicalUnit 固有UI） */
  children: ReactNode
}

export default function EntryCard({
  headword,
  isBookmarked,
  isSaveDisabled = false,
  onSave,
  children,
}: EntryCardProps) {
  const speak = (text: string) => {
    if (!text) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "en-GB"
    utter.rate = 0.9
    speechSynthesis.cancel()
    speechSynthesis.speak(utter)
  }

  return (
    <div className="mb-4 w-full bg-white md:bg-gray-100">
      <div className="bg-white p-4 md:rounded-2xl md:p-6 w-full">

        {/* ================= HEADER（常に表示） ================= */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{headword}</h2>
            <button onClick={() => speak(headword)}>
              <FaVolumeHigh size={20} />
            </button>
          </div>

          <button
            onClick={onSave}
            disabled={isSaveDisabled}
          >
            {isBookmarked ? <BsBookmarkFill /> : <BsBookmark />}
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        {children}

      </div>
    </div>
  )
}
