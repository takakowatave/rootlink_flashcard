'use client'

import { useRef, useState } from 'react'
import { MdIosShare, MdClose, MdArrowBackIosNew } from 'react-icons/md'
import { BsArrowUpRightSquare } from 'react-icons/bs'
import ModalShell from '@/components/ModalShell'
import WordPageClient from '@/components/WordPageClient'
import ShareMenu from '@/components/ShareMenu'
import { buildShareText } from '@/lib/shareText'
import { shareViaClipboardAndX } from '@/lib/shareToX'
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
  const shareBtnRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <ModalShell
        open
        onClose={onClose}
        headerLeft={
          <>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="戻る"
            >
              <MdArrowBackIosNew className="size-6" />
            </button>
            <a
              href={`/word/${encodeURIComponent(word)}`}
              className="hidden md:inline-flex p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="単語ページを開く"
            >
              <BsArrowUpRightSquare className="size-5" />
            </a>
          </>
        }
        headerRight={
          <>
            <button
              ref={shareBtnRef}
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
              className="hidden md:inline-flex p-2 rounded-full hover:bg-gray-100 text-muted"
              aria-label="閉じる"
            >
              <MdClose className="size-6" />
            </button>
          </>
        }
      >
        <WordPageClient
          word={word}
          dictionary={dictionary}
          savedId={savedId}
          initialPinnedSenseId={initialPinnedSenseId ?? null}
          initialDisplayLocale={displayLocale}
          noCard
        />
      </ModalShell>
      <ShareMenu
        open={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        shareUrl={`https://www.rootlink.app/word/${encodeURIComponent(word)}`}
        shareText={buildShareText(word, dictionary, initialPinnedSenseId ?? null)}
        anchorRef={shareBtnRef}
        onShareX={() => shareViaClipboardAndX({
          cardUrl: `https://www.rootlink.app/word/${encodeURIComponent(word)}/card.png`,
          filename: `rootlink-${word}.png`,
          shareText: buildShareText(word, dictionary, initialPinnedSenseId ?? null),
        })}
      />
    </>
  )
}
