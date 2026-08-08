'use client'

import { useEffect, useState } from 'react'
import { BsX, BsArrowUpRightSquare } from 'react-icons/bs'
import WordPageClient from '@/components/WordPageClient'
import type { SavedWordDictionary } from '@/types/Dictionary'
import type { DisplayLocale } from '@/types/DisplayLocale'

type Props = {
  word: string
  dictionary: SavedWordDictionary | null | undefined
  savedId?: string
  initialPinnedSenseId?: string | null
  displayLocale: DisplayLocale
  onClose: () => void
}

export default function WordDetailModal({
  word, dictionary, savedId, initialPinnedSenseId, displayLocale, onClose,
}: Props) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      const restoreY = parseInt(document.body.style.top || '0') * -1
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, restoreY)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl h-[90dvh] flex flex-col shadow-xl overflow-x-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* SP: grabber (drag handle indicator) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 sm:border-b sm:border-line flex-shrink-0">
          {/* SP: close on left / PC: title fades in on left */}
          <button
            onClick={onClose}
            className="sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors text-muted"
            aria-label="閉じる"
          >
            <BsX size={24} />
          </button>
          <span
            className={`hidden sm:inline text-base font-semibold text-gray-800 transition-opacity duration-150 ${scrolled ? 'opacity-100' : 'opacity-0'}`}
          >
            {word}
          </span>
          <div className="flex items-center gap-1">
            <a
              href={`/word/${word}`}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-muted"
              aria-label="単語ページへ"
            >
              <BsArrowUpRightSquare size={24} />
            </a>
            {/* PC only: close on right */}
            <button
              onClick={onClose}
              className="hidden sm:inline-flex p-2 rounded-full hover:bg-gray-100 transition-colors text-muted"
              aria-label="閉じる"
            >
              <BsX size={24} />
            </button>
          </div>
        </div>
        <div
          className="overflow-y-auto overflow-x-hidden flex-1 w-full pb-8"
          onScroll={(e) => setScrolled((e.currentTarget as HTMLDivElement).scrollTop > 40)}
        >
          <WordPageClient
            word={word}
            dictionary={dictionary}
            savedId={savedId}
            initialPinnedSenseId={initialPinnedSenseId ?? null}
            initialDisplayLocale={displayLocale}
            noCard
          />
        </div>
      </div>
    </div>
  )
}
