'use client'

import { useEffect, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { HiBookmark, HiOutlineBookmark, HiSpeakerWave } from 'react-icons/hi2'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'
import CardShell from '@/components/CardShell'
import SenseExample from '@/components/SenseExample'
import { TYPE_LABEL, REGISTER_LABEL, LOCALE_LABEL, pickLabel } from '@/lib/phraseLabels'

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

function cleanPhrase(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
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

  const handleSaveClick = (e: ReactMouseEvent) => {
    e.stopPropagation()
    onSave()
  }

  const handleHeadwordClick = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onPlayHeadword?.()
  }

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
  const defaultHref = `/word/${cleanPhrase(card.phrase).replace(/\s+/g, '_')}`
  const handleCardClick = onClickProp ?? (() => router.push(defaultHref))

  return (
    <CardShell onClick={handleCardClick}>
      {/* HEADER */}
      <div className="flex items-center justify-between py-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-2xl font-semibold leading-8 text-black">{cleanPhrase(card.phrase)}</h2>
          {onPlayHeadword && (
            <button
              type="button"
              onClick={handleHeadwordClick}
              disabled={!!headwordAudioLoading}
              className="shrink-0"
            >
              <HiSpeakerWave className={`size-6 ${headwordAudioLoading ? 'text-muted animate-pulse' : 'text-muted'}`} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveClick}
          className="p-2 -mr-2 -mt-1 shrink-0"
          aria-label={isSaved ? '保存済み' : '保存'}
        >
          {isSaved
            ? <HiBookmark className="size-6 text-muted" />
            : <HiOutlineBookmark className="size-6 text-primary" />
          }
        </button>
      </div>

      {/* メタ */}
      {(typeLabel || localeLabel || registerLabel) && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {typeLabel && (
            <span className="text-xs text-muted border border-line rounded px-2 py-1">{typeLabel}</span>
          )}
          {localeLabel && (
            <span className="text-xs text-muted border border-line rounded px-2 py-1">{localeLabel}</span>
          )}
          {registerLabel && (
            <span className="text-xs text-muted border border-line rounded px-2 py-1">{registerLabel}</span>
          )}
        </div>
      )}

      {/* 意味 */}
      {meaning && (
        <p className="text-base font-medium text-black">{meaning}</p>
      )}

      {/* 例文 */}
      <div>
        <SenseExample
          example={example}
          translation={exampleJa}
          displayLocale={displayLocale}
          onPlay={onPlayExample}
          isLoading={exampleAudioLoading}
        />
      </div>
    </CardShell>
  )
}
