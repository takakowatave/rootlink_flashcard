'use client'

import { HiSpeakerWave } from 'react-icons/hi2'
import type { DisplayLocale } from '@/types/DisplayLocale'

type Props = {
  example: string | null | undefined
  translation: string | null | undefined
  displayLocale: DisplayLocale
  onPlay?: () => void
  isLoading?: boolean
}

export default function SenseExample({ example, translation, displayLocale, onPlay, isLoading }: Props) {
  const showTranslation = displayLocale === 'ja' && !!translation
  if (!example && !showTranslation) return null

  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-black">
      {example && (
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1">{example}</p>
          {onPlay && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlay() }}
              disabled={!!isLoading}
              className="shrink-0"
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
