'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'

type Props = {
  title: string
  audioLoading?: boolean
  onPlayAudio?: () => void
  isSaved: boolean
  onSave: (e?: ReactMouseEvent) => void
  saveTooltip?: { saved: string; unsaved: string }
  headingLevel?: 'h1' | 'h2'
  tutorialAttr?: boolean
}

export default function CardHeader({
  title,
  audioLoading,
  onPlayAudio,
  isSaved,
  onSave,
  saveTooltip,
  headingLevel = 'h1',
  tutorialAttr = false,
}: Props) {
  const Heading = headingLevel

  const handleAudioClick = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPlayAudio?.()
  }

  const handleSaveClick = (e: ReactMouseEvent) => {
    e.stopPropagation()
    onSave(e)
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5 min-w-0">
        <Heading className="text-2xl font-semibold leading-8 text-black">{title}</Heading>
        {onPlayAudio && (
          <button
            type="button"
            onClick={handleAudioClick}
            disabled={!!audioLoading}
            className="shrink-0"
          >
            <HiSpeakerWave className={`size-6 ${audioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
          </button>
        )}
      </div>
      <div className="group/save relative shrink-0">
        <button
          type="button"
          onClick={handleSaveClick}
          {...(tutorialAttr ? { 'data-tutorial': 'save-button' } : {})}
          aria-label={isSaved ? '保存済み' : '保存'}
          className="p-2 -mr-2 -mt-1"
        >
          {isSaved
            ? <HiBookmark className="size-6 text-muted" />
            : <HiOutlineBookmark className="size-6 text-primary" />
          }
        </button>
        {saveTooltip && (
          <span className="pointer-events-none absolute top-full right-0 z-20 mt-2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/save:opacity-100">
            {isSaved ? saveTooltip.saved : saveTooltip.unsaved}
          </span>
        )}
      </div>
    </div>
  )
}
