'use client'

// wordページ全体のレイアウト担当
// header / memory hook / senses / synonyms などの sections を並べる
// WordPageClient から渡された表示用データを locale に応じて描画する

import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit } from '@/types/LexicalUnit'
import { BsPin, BsPinFill } from 'react-icons/bs'
import LanguageToggle from '@/components/LanguageToggle'
import GrammarTags from '@/components/GrammarTags'

type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type SimpleLexicalUnit = {
  lexicalUnitId: string
  text: string
}

type DisplayLocale = 'en' | 'ja'

type EtymologyPartType = 'prefix' | 'root' | 'suffix' | 'unknown'

type OriginLanguage = {
  key: string
  labelEn: string
  labelJa: string
}

type EtymologyPart = {
  text: string
  partType: EtymologyPartType
  meaning: string | null
  meaningJa?: string | null
  relatedWords: string[]
  order: number
}

type PartsEtymologyStructure = {
  type: 'parts'
  parts: EtymologyPart[]
  hook: string | null
}

type OriginEtymologyStructure = {
  type: 'origin'
  sourceWord: string | null
  sourceMeaning: string | null
  hook: string | null
}

type EtymologyData = {
  originLanguage: OriginLanguage | null
  rawEtymology: string | null
  wordFamily: string[]
  structure: PartsEtymologyStructure | OriginEtymologyStructure
}

type LocalizedEtymologyJa = {
  originLanguageLabel?: string
  description?: string
  sourceMeaning?: string
  hook?: string
}

type SenseItem = {
  senseId: string
  meaning: string
  example?: string
  exampleTranslation?: string
}

type Props = {
  headword: string
  pronunciation: Pronunciation
  etymology: string
  etymologyData: EtymologyData | null
  localizedEtymologyJa: LocalizedEtymologyJa | null
  senses: Record<string, SenseItem[]>
  lexicalUnits: Array<LexicalUnit | SimpleLexicalUnit>
  inflections: string[]
  synonyms: string[]
  derivatives: string[]
  antonyms: string[]
  grammarTags: Record<string, string[]>
  isBookmarked: boolean
  onSave: () => void
  pinnedSenseId: string | null
  onTogglePin: (senseId: string) => void
  displayLocale: DisplayLocale
  onChangeDisplayLocale: (locale: DisplayLocale) => void
}

const POS_LABEL_EN: Record<string, string> = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adjective',
  adverb: 'adverb',
  pronoun: 'pronoun',
  preposition: 'preposition',
  conjunction: 'conjunction',
  determiner: 'determiner',
  interjection: 'interjection',
}

function getPosLabel(pos: string, locale: DisplayLocale): string {
  if (locale === 'ja') {
    return POS_LABEL_JA[pos] ?? pos
  }

  return POS_LABEL_EN[pos] ?? pos
}

export default function EntryCard({
  headword,
  pronunciation,
  etymology,
  etymologyData,
  localizedEtymologyJa,
  senses = {},
  inflections = [],
  synonyms = [],
  antonyms = [],
  derivatives = [],
  grammarTags = {},
  isBookmarked,
  pinnedSenseId,
  displayLocale,
  onChangeDisplayLocale,
  onTogglePin,
  onSave,
}: Props) {
  // 音声再生担当
  const playAudio = () => {
    if (!pronunciation?.audioFile) return
    new Audio(pronunciation.audioFile).play()
  }

  // ラベル切り替え担当
  const labels =
    displayLocale === 'ja'
      ? {
          memoryHook: '語源フック',
          originLanguage: '語源言語',
          derivatives: '派生語',
          synonyms: '類義語',
          antonyms: '対義語',
          noMemoryHook: 'まだ語源フックはありません。',
          pinThisSense: 'この意味をピン留め',
        }
      : {
          memoryHook: 'Memory Hook',
          originLanguage: 'originLanguage',
          derivatives: 'derivatives',
          synonyms: 'Synonyms',
          antonyms: 'Antonyms',
          noMemoryHook: 'No memory hook available yet.',
          pinThisSense: 'Pin this sense',
        }

  // Memory Hook 用の表示データ
  const originLanguage = etymologyData?.originLanguage ?? null

  const parts =
    etymologyData?.structure.type === 'parts'
      ? etymologyData.structure.parts.filter(
          (part) => Boolean(part.text) || Boolean(part.meaning)
        )
      : []

  const displayedOriginLanguageLabel =
    displayLocale === 'ja'
      ? localizedEtymologyJa?.originLanguageLabel ??
        originLanguage?.labelJa ??
        originLanguage?.labelEn
      : originLanguage?.labelEn ?? originLanguage?.labelJa

  const displayedEtymologyDescription =
    displayLocale === 'ja'
      ? localizedEtymologyJa?.description ?? etymology
      : etymology

  const hasParts = parts.length > 0
  const hasEtymologyText = Boolean(
    displayedEtymologyDescription &&
      displayedEtymologyDescription.trim().length > 0
  )
  

  // derivatives の並びを最低限整える
  const orderedDerivatives = [...new Set(derivatives)].sort((a, b) => {
    const score = (value: string) => {
      if (value.endsWith('ing')) return 3
      if (value.endsWith('ed')) return 2
      if (value.endsWith('s')) return 1
      return 0
    }

    return score(a) - score(b)
  })

  return (
    <div className="mx-auto mt-6 max-w-2xl px-4">
      <div className="rounded-2xl bg-white p-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-gray-900">
              {headword}
            </h1>

            {pronunciation?.audioFile && (
              <button type="button" onClick={playAudio}>
                <HiSpeakerWave className="h-5 w-5 text-gray-500" />
              </button>
            )}

            {pronunciation?.phoneticSpelling && (
              <span className="text-gray-500">
                /{pronunciation.phoneticSpelling}/
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle
              value={displayLocale}
              onChange={onChangeDisplayLocale}
            />

            <button type="button" onClick={onSave}>
              <HiBookmark
                className={
                  'h-6 w-6 ' +
                  (isBookmarked ? 'text-blue-500' : 'text-gray-300')
                }
              />
            </button>
          </div>
        </div>

        {/* MEMORY HOOK */}
        {/* MEMORY HOOK */}
        <div className="mt-6 rounded-2xl bg-green-50 p-4">
          <div className="font-semibold text-green-700">
            {labels.memoryHook}
          </div>

          {/* originLanguage */}
          {displayedOriginLanguageLabel && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="font-semibold text-green-700">
                {labels.originLanguage}
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-xs border border-gray-300 bg-white px-4 py-1 text-xs text-gray-500">
                  {displayedOriginLanguageLabel}
                </span>
              </div>
            </div>
          )}

          {/* parts は補助表示 */}
          {hasParts && (
            <div className="mt-4 flex flex-wrap gap-4">
              {parts.map((part, index) => {
                const displayedMeaning =
                  displayLocale === 'ja'
                    ? part.meaningJa ?? part.meaning ?? ''
                    : part.meaning ?? part.meaningJa ?? ''

                return (
                  <div
                    key={`${part.text ?? 'part'}-${index}`}
                    className="flex min-w-[260px] items-center gap-6 rounded-xl bg-green-100 px-4 py-4"
                  >
                    <span className="rounded-xl border-2 border-green-500 bg-white px-5 py-1 text-sm leading-none text-green-600">
                      {part.text}
                    </span>

                    <span className="text-sm text-green-700">
                      {displayedMeaning}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* 語源文は常時表示 */}
          {hasEtymologyText ? (
            <p className="mt-4 text-xs leading-8 text-green-900">
              {displayedEtymologyDescription}
            </p>
          ) : (
            <p className="mt-4 text-xs leading-8 text-green-900">
              {labels.noMemoryHook}
            </p>
          )}

          {/* derivatives */}
          {orderedDerivatives.length > 0 && (
            <div className="mt-6">
              <div className="text-xl font-semibold text-green-700">
                {labels.derivatives}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {orderedDerivatives.map((derivative) => (
                  <span
                    key={derivative}
                    className="text-xs text-green-700 underline underline-offset-4"
                  >
                    {derivative}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SENSES */}
        <div className="mt-6 space-y-8">
          {Object.entries(senses)
            .filter(([, items]) => items.length > 0)
            .map(([pos, items]) => (
              <div key={pos}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded-full border px-3 py-1 text-xs text-gray-600">
                    {getPosLabel(pos, displayLocale)}
                  </span>
                </div>

                {pos === 'verb' && inflections.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {inflections.join(' · ')}
                  </span>
                )}

                <div className="mt-4 space-y-4">
                  {items.map((sense) => {
                    const isPinned = pinnedSenseId === sense.senseId

                    return (
                      <div
                        key={sense.senseId}
                        className="group flex items-start justify-between gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-900">{sense.meaning}</p>

                          {grammarTags[sense.senseId] &&
                            grammarTags[sense.senseId].length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <GrammarTags
                                  tags={grammarTags[sense.senseId]}
                                  displayLocale={displayLocale}
                                />
                              </div>
                            )}

                          {(sense.example || sense.exampleTranslation) && (
                            <div className="mt-2 space-y-1">
                              {sense.example && (
                                <p className="text-gray-600">
                                  {sense.example}
                                </p>
                              )}

                              {sense.exampleTranslation && (
                                <p className="text-gray-500">
                                  {sense.exampleTranslation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="group/pin relative shrink-0">
                          <button
                            type="button"
                            onClick={() => onTogglePin(sense.senseId)}
                            className="flex h-8 w-8 items-center justify-center"
                          >
                            {isPinned ? (
                              <BsPinFill className="h-5 w-5 text-gray-400" />
                            ) : (
                              <BsPin className="h-5 w-5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 group-hover/pin:opacity-100 group-hover/pin:text-gray-400" />
                            )}
                          </button>

                          {!isPinned && (
                            <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-700 px-4 py-3 text-sm text-white opacity-0 shadow-md transition-opacity group-hover/pin:opacity-100">
                              {labels.pinThisSense}
                              <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-gray-700" />
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>

        {/* SYNONYMS */}
        {synonyms.length > 0 && (
          <div className="mt-6">
            <div className="mb-1 text-xs text-gray-400">
              {labels.synonyms}
            </div>
            <div className="text-gray-800">
              {synonyms.slice(0, 8).join(', ')}
            </div>
          </div>
        )}

        {/* ANTONYMS */}
        {antonyms.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-xs text-gray-400">
              {labels.antonyms}
            </div>
            <div className="text-gray-800">
              {antonyms.slice(0, 8).join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}