'use client'

import type { MouseEvent as ReactMouseEvent } from 'react'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import { MdIosShare } from 'react-icons/md'
import { useLocale } from '@/lib/LocaleProvider'
import { messages } from '@/lib/i18n/messages'

type Props = {
  title: string
  audioLoading?: boolean
  onPlayAudio?: () => void
  // /audio が NO_AUDIO を返した後は true。音声ボタンを薄く disabled にして
  // click を no-op にする。
  audioUnavailable?: boolean
  isSaved: boolean
  onSave: (e?: ReactMouseEvent) => void
  onShare?: (e?: ReactMouseEvent) => void
  shareBtnRef?: React.Ref<HTMLButtonElement>
  saveTooltip?: { saved: string; unsaved: string }
  // 呼び出し側 (EntryCard) が locale に応じて差し込む aria-label。未指定時は JA を既定。
  ariaLabels?: {
    audioPlay?: string
    audioUnavailable?: string
    share?: string
    saved?: string
    save?: string
  }
  headingLevel?: 'h1' | 'h2'
  tutorialAttr?: boolean
}

export default function CardHeader({
  title,
  audioLoading,
  onPlayAudio,
  audioUnavailable = false,
  isSaved,
  onSave,
  onShare,
  shareBtnRef,
  saveTooltip,
  ariaLabels,
  headingLevel = 'h1',
  tutorialAttr = false,
}: Props) {
  const locale = useLocale()
  const c = messages[locale].common
  const defaults = {
    audioPlay: c.audioPlay,
    audioUnavailable: c.audioUnavailable,
    share: c.shareLabel,
    saved: c.savedLabel,
    save: c.saveLabel,
  }
  const L = { ...defaults, ...(ariaLabels ?? {}) }
  const Heading = headingLevel

  const handleAudioClick = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (audioUnavailable) return
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
            disabled={!!audioLoading || audioUnavailable}
            aria-label={audioUnavailable ? L.audioUnavailable : L.audioPlay}
            className="shrink-0 disabled:cursor-not-allowed"
          >
            <HiSpeakerWave
              className={`size-6 ${
                audioUnavailable
                  ? 'text-muted opacity-30'
                  : audioLoading
                    ? 'text-muted animate-pulse'
                    : 'text-muted'
              }`}
            />
          </button>
        )}
      </div>
      <div className="flex items-center shrink-0">
        {onShare && (
          <button
            ref={shareBtnRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); onShare(e) }}
            aria-label={L.share}
            className="hidden md:inline-flex p-2 -mt-1 rounded-full hover:bg-primary-subtle text-muted"
          >
            <MdIosShare className="size-6" />
          </button>
        )}
        <div className="group/save relative">
          <button
            type="button"
            onClick={handleSaveClick}
            {...(tutorialAttr ? { 'data-tutorial': 'save-button' } : {})}
            aria-label={isSaved ? L.saved : L.save}
            // touch-manipulation: iOS WebView の 300ms タップ遅延を排除
            className="p-2 -mr-2 -mt-1 touch-manipulation"
          >
            {isSaved
              ? <HiBookmark className="size-6 text-muted" />
              : <HiOutlineBookmark className="size-6 text-primary" />
            }
          </button>
          {saveTooltip && (
            // hover tooltip は desktop 用。SP は tap で hover が sticky になり出っぱなしになるので出さない。
            <span className="hidden md:block pointer-events-none absolute top-full right-0 z-20 mt-2 whitespace-nowrap rounded-lg bg-gray-700 px-3 py-2 text-xs text-white opacity-0 shadow-md transition-opacity group-hover/save:opacity-100">
              {isSaved ? saveTooltip.saved : saveTooltip.unsaved}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
