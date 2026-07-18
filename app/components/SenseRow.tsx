'use client'

import type { DisplayLocale } from '@/types/DisplayLocale'
import SenseExample from '@/components/SenseExample'
import SensePinButton from '@/components/SensePinButton'
import GrammarTags from '@/components/GrammarTags'

type Props = {
  meaning: string
  ordinal?: number
  example?: string | null
  translation?: string | null
  displayLocale: DisplayLocale
  onPlayExample?: () => void
  exampleLoading?: boolean
  grammarTags?: string[]
  showPinButton?: boolean
  isPinned?: boolean
  onTogglePin?: () => void
  tutorialPinAttr?: boolean
}

export default function SenseRow({
  meaning,
  ordinal,
  example,
  translation,
  displayLocale,
  onPlayExample,
  exampleLoading,
  grammarTags,
  showPinButton,
  isPinned = false,
  onTogglePin,
  tutorialPinAttr,
}: Props) {
  return (
    <div className="group flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-black">
          {ordinal != null && (
            <span className="text-muted mr-2">{ordinal}.</span>
          )}
          {meaning}
        </p>

        {grammarTags && grammarTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            <GrammarTags tags={grammarTags} displayLocale={displayLocale} />
          </div>
        )}

        <SenseExample
          example={example}
          translation={translation}
          displayLocale={displayLocale}
          onPlay={onPlayExample}
          isLoading={exampleLoading}
        />
      </div>

      {showPinButton && onTogglePin && (
        <SensePinButton
          isPinned={isPinned}
          onToggle={onTogglePin}
          displayLocale={displayLocale}
          tutorialAttr={tutorialPinAttr}
        />
      )}
    </div>
  )
}
