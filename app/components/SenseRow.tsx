'use client'

import type { DisplayLocale } from '@/types/DisplayLocale'
import SenseExample from '@/components/SenseExample'
import SensePinButton from '@/components/SensePinButton'
import GrammarTags from '@/components/GrammarTags'
import PhraseNotes from '@/components/PhraseNotes'

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
  // フレーズ用: 例文中の強調語（複数）と解説
  highlights?: string[] | null
  explanation?: string | null
  usEquivalent?: string | null
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
  highlights,
  explanation,
  usEquivalent,
}: Props) {
  return (
    <div className="group flex items-start gap-2 rounded-xl -mx-3 px-3 py-2 hover:bg-primary-light transition-colors">
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
          highlights={highlights}
        />

        {(explanation || usEquivalent) && (
          <div className="mt-2">
            <PhraseNotes explanation={explanation} usEquivalent={usEquivalent} displayLocale={displayLocale} />
          </div>
        )}
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
