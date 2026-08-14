'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import CardShell from '@/components/CardShell'
import CardHeader from '@/components/CardHeader'
import SenseExample from '@/components/SenseExample'
import { TYPE_LABEL, REGISTER_LABEL, LOCALE_LABEL, pickLabel } from '@/lib/phraseLabels'
import { stripPhraseParens, displayPhrase } from '@/lib/phraseDisplay'

export type PhraseCardSense = {
  sense_id: string
  meaning_ja: string | null
  meaning_en: string | null
  example_en: string | null
  example_ja: string | null
}

export type PhraseCardData = {
  id: string
  phrase: string
  meaning_ja: string | null
  meaning_en: string | null
  example_en: string | null
  example_ja: string | null
  type: string | null
  register: string | null
  locale: string | null
  senses: PhraseCardSense[] | null
}

type Props = {
  card: PhraseCardData
  isSaved: boolean
  onSave: () => void
  displayLocale?: DisplayLocale
  onPlayHeadword?: () => void
  headwordAudioLoading?: boolean
  onPlayExample?: () => void
  exampleAudioLoading?: boolean
  onClick?: () => void
}

export default function PhraseCard({
  card,
  isSaved,
  onSave,
  displayLocale: displayLocaleProp,
  onPlayHeadword,
  headwordAudioLoading,
  onPlayExample,
  exampleAudioLoading,
  onClick: onClickProp,
}: Props) {
  const router = useRouter()
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>(() => {
    if (displayLocaleProp) return displayLocaleProp
    if (typeof window === 'undefined') return 'ja'
    return (localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale) ?? 'ja'
  })

  useEffect(() => {
    if (displayLocaleProp) { setDisplayLocale(displayLocaleProp); return }
    const handler = () => {
      const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
      if (saved) setDisplayLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [displayLocaleProp])

  const primary = card.senses?.[0]
  const meaning = displayLocale === 'ja'
    ? (primary?.meaning_ja ?? card.meaning_ja ?? card.meaning_en ?? '')
    : (primary?.meaning_en ?? card.meaning_en ?? card.meaning_ja ?? '')
  const example = primary?.example_en ?? card.example_en
  const exampleJa = primary?.example_ja ?? card.example_ja

  const typeLabel = pickLabel(TYPE_LABEL, card.type, displayLocale)
  const registerLabel = card.register && card.register !== 'neutral'
    ? pickLabel(REGISTER_LABEL, card.register, displayLocale)
    : null
  const localeLabel = pickLabel(LOCALE_LABEL, card.locale, displayLocale)
  const defaultHref = `/word/${stripPhraseParens(card.phrase).replace(/\s+/g, '_')}`
  const handleCardClick = onClickProp ?? (() => router.push(defaultHref))

  return (
    <CardShell onClick={handleCardClick}>
      {/* HEADER */}
      <CardHeader
        title={displayPhrase(card.phrase)}
        audioLoading={headwordAudioLoading}
        onPlayAudio={onPlayHeadword}
        isSaved={isSaved}
        onSave={onSave}
        headingLevel="h2"
      />

      <div className="mt-2 flex flex-col gap-4">
        <div>
          {/* メタ */}
          {(typeLabel || localeLabel || registerLabel) && (
            <div className="flex flex-wrap items-center gap-2">
              {typeLabel && (
                <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">{typeLabel}</span>
              )}
              {localeLabel && (
                <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">{localeLabel}</span>
              )}
              {registerLabel && (
                <span className="inline-flex items-center border border-muted rounded-full px-2 py-1 text-xs font-medium text-muted">{registerLabel}</span>
              )}
            </div>
          )}

          {/* 意味 */}
          {meaning && (
            <p className="mt-2 text-base font-medium text-black">{meaning}</p>
          )}

          {/* 例文 */}
          <SenseExample
            example={example}
            translation={exampleJa}
            displayLocale={displayLocale}
            onPlay={onPlayExample}
            isLoading={exampleAudioLoading}
          />
        </div>
      </div>
    </CardShell>
  )
}
