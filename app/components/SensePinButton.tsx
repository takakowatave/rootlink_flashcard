'use client'

import { BsPin, BsPinFill } from 'react-icons/bs'
import type { DisplayLocale } from '@/types/DisplayLocale'

type Props = {
  isPinned: boolean
  onToggle: () => void
  displayLocale: DisplayLocale
  tutorialAttr?: boolean
}

export default function SensePinButton({ isPinned, onToggle, displayLocale, tutorialAttr }: Props) {
  const pinLabel = displayLocale === 'ja' ? 'この意味をピン留め' : 'Pin this sense'
  const pinnedLabel = displayLocale === 'ja' ? 'この意味がピン留めされています' : 'This sense is pinned'

  return (
    <div className="group/pin relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        {...(tutorialAttr ? { 'data-tutorial': 'pin-button' } : {})}
        className="flex size-10 items-center justify-center -mr-1"
        aria-label={pinLabel}
      >
        {isPinned
          ? <BsPinFill className="size-4 text-primary" />
          : <BsPin className="size-4 text-muted opacity-40 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-hover/pin:opacity-100" />
        }
      </button>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/pin:opacity-100">
        {isPinned ? pinnedLabel : pinLabel}
      </span>
    </div>
  )
}
