'use client'

import { HiSpeakerWave } from 'react-icons/hi2'
import type { DisplayLocale } from '@/types/DisplayLocale'
import HighlightedText from '@/components/blog/HighlightedText'

type Props = {
  example: string | null | undefined
  translation: string | null | undefined
  displayLocale: DisplayLocale
  onPlay?: () => void
  isLoading?: boolean
  // 例文の中で強調する表現（大文字小文字は区別しない）。見つからなければ強調しない
  highlight?: string | null
}

export default function SenseExample({ example, translation, displayLocale, onPlay, isLoading, highlight }: Props) {
  const showTranslation = displayLocale === 'ja' && !!translation
  if (!example && !showTranslation) return null

  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-black">
      {example && (
        <div className="flex items-start gap-2">
          <p className="flex-1 min-w-0">
            <HighlightedText terms={highlight ? [highlight] : []} termClassName="font-bold text-primary">{example}</HighlightedText>
          </p>
          {onPlay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlay() }}
              disabled={!!isLoading}
              className="shrink-0 flex size-10 items-center justify-center -mr-1 -my-2"
            >
              <HiSpeakerWave className={`size-5 ${isLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
            </button>
          )}
        </div>
      )}
      {showTranslation && <p>{translation}</p>}
    </div>
  )
}
