'use client'

import { useEffect, useState } from 'react'
import { MdIosShare, MdArrowBackIosNew } from 'react-icons/md'
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Figma 2319:8255 header — arrow_back_ios (left) / ios_share (right) */}
      <div className="flex items-center justify-between border-b border-line h-14 px-4 flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-muted"
          aria-label="戻る"
        >
          <MdArrowBackIosNew className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => setShowShareMenu(true)}
          className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-muted"
          aria-label="共有"
        >
          <MdIosShare className="size-6" />
        </button>
      </div>
      <div className="overflow-y-auto overflow-x-hidden flex-1 w-full pb-8">
        <WordPageClient
          word={word}
          dictionary={dictionary}
          savedId={savedId}
          initialPinnedSenseId={initialPinnedSenseId ?? null}
          initialDisplayLocale={displayLocale}
          noCard
        />
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
