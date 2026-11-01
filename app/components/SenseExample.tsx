'use client'

import { HiSpeakerWave } from 'react-icons/hi2'
import type { DisplayLocale } from '@/types/DisplayLocale'
import HighlightedText from '@/components/blog/HighlightedText'
import { buildPhraseSpanRegex } from '@/lib/phraseDisplay'
import { jaHighlightMatches } from '@/lib/jaHighlight'

type Props = {
  example: string | null | undefined
  translation: string | null | undefined
  displayLocale: DisplayLocale
  onPlay?: () => void
  isLoading?: boolean
  // 例文の中で強調する表現 (単純一致版)。phrase を使う場合は不要。
  highlights?: string[] | null
  // 熟語の見出し語。渡すと buildPhraseSpanRegex で活用・冠詞揺らぎ・連続スパンを吸収して
  // example 側をハイライトする。
  phrase?: string | null
  // meaning_ja。渡すと jaHighlightMatches で translation 側もハイライトする。
  meaning?: string | null
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderExampleWithPhrase(text: string, phrase: string): React.ReactNode {
  const pat = buildPhraseSpanRegex(phrase)
  const re = new RegExp(`(${pat})`, 'gi')
  const parts = text.split(re)
  const match = new RegExp(`^(?:${pat})$`, 'i')
  return parts.map((p, i) => match.test(p)
    ? <span key={i} className="font-bold text-primary">{p}</span>
    : <span key={i}>{p}</span>)
}

function renderTranslationWithMeaning(ja: string, meaning: string): React.ReactNode {
  const matches = jaHighlightMatches(meaning, ja)
  if (matches.length === 0) return ja
  const re = new RegExp(`(${matches.map(escapeRe).join('|')})`, 'g')
  const matchSet = new Set(matches)
  return ja.split(re).map((p, i) => matchSet.has(p)
    ? <span key={i} className="font-bold text-primary">{p}</span>
    : <span key={i}>{p}</span>)
}

export default function SenseExample({ example, translation, displayLocale, onPlay, isLoading, highlights, phrase, meaning }: Props) {
  const showTranslation = displayLocale === 'ja' && !!translation
  if (!example && !showTranslation) return null

  const terms = (highlights ?? []).filter((t): t is string => !!t && t.length > 0)

  return (
    <div className="mt-2 flex flex-col gap-2 text-sm text-black">
      {example && (
        <div className="flex items-start gap-2">
          <p className="flex-1 min-w-0">
            {phrase
              ? renderExampleWithPhrase(example, phrase)
              : <HighlightedText terms={terms} termClassName="font-bold text-primary">{example}</HighlightedText>}
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
      {showTranslation && translation && (
        <p>
          {meaning
            ? renderTranslationWithMeaning(translation, meaning)
            : translation}
        </p>
      )}
    </div>
  )
}
