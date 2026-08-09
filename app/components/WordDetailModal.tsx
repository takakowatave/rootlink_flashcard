'use client'

import { useEffect, useState } from 'react'
import { MdIosShare, MdClose } from 'react-icons/md'
import { BsArrowUpRightSquare } from 'react-icons/bs'
import WordPageClient from '@/components/WordPageClient'
import ShareMenu from '@/components/ShareMenu'
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
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 bg-white w-full max-w-[720px] max-h-[85dvh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line h-12 px-3 flex-shrink-0">
          <a
            href={`/word/${encodeURIComponent(word)}`}
            className="p-2 rounded-full hover:bg-gray-100 text-muted"
            aria-label="単語ページを開く"
          >
            <BsArrowUpRightSquare className="size-5" />
          </a>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowShareMenu(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="共有"
            >
              <MdIosShare className="size-6" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="閉じる"
            >
              <MdClose className="size-6" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 w-full">
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
      <ShareMenu
        open={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        shareUrl={`https://www.rootlink.app/word/${encodeURIComponent(word)}`}
        shareText={`${word} — 語源から学ぶ英単語｜RootLink`}
      />
    </div>
  )
}
