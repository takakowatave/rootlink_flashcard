'use client'

// wordページ全体のレイアウト
// header / memory hook / senses / lexicalUnits / synonyms などの sections を並べる
// 各 section に適切な子コンポーネントを渡す

import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit } from '@/types/LexicalUnit'
import { BsPin, BsPinFill } from 'react-icons/bs'
import LexicalUnitCard from '@/components/LexicalUnitCard'

type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type SimpleLexicalUnit = {
  lexicalUnitId: string
  text: string
}

type EtymologyPart = {
  text?: string
  type?: string
  meaning?: string
}

type EtymologyData = {
  originLanguage?: string[]
  parts?: EtymologyPart[]
}

type SenseItem = {
  senseId: string
  meaning: string
  example?: string
  patterns?: string[]
}

type Props = {
  headword: string
  pronunciation?: Pronunciation
  etymology?: string
  etymologyData?: EtymologyData | null
  senses?: Record<string, SenseItem[]>
  lexicalUnits?: (LexicalUnit | SimpleLexicalUnit)[]
  inflections?: string[]
  synonyms?: string[]
  derivatives?: string[]
  antonyms?: string[]
  grammarTags?: Record<string, string[]>
  isBookmarked: boolean
  onSave?: () => void | Promise<void>
  pinnedSenseId: string | null
  onTogglePin: (senseId: string) => void
}

function isDetailedLexicalUnit(
  unit: LexicalUnit | SimpleLexicalUnit
): unit is LexicalUnit {
  return 'phrase' in unit
}

function isSimpleLexicalUnit(
  unit: LexicalUnit | SimpleLexicalUnit
): unit is SimpleLexicalUnit {
  return 'text' in unit
}

export default function EntryCard({
  headword,
  pronunciation,
  etymology,
  etymologyData,
  senses = {},
  lexicalUnits = [],
  inflections = [],
  synonyms = [],
  antonyms = [],
  derivatives = [],
  grammarTags = {},
  isBookmarked,
  pinnedSenseId,
  onTogglePin,
  onSave,
}: Props) {
  // 音声再生
  const playAudio = () => {
    if (!pronunciation?.audioFile) return
    new Audio(pronunciation.audioFile).play()
  }

  // lexical unit の型絞り込み
  const detailedLexicalUnits = lexicalUnits.filter(isDetailedLexicalUnit)
  const simpleLexicalUnits = lexicalUnits.filter(isSimpleLexicalUnit)

  // Memory Hook 用の表示データ
  const originLanguages = Array.isArray(etymologyData?.originLanguage)
    ? etymologyData.originLanguage.filter(
        (item): item is string => typeof item === 'string' && item.length > 0
      )
    : []

  const parts = Array.isArray(etymologyData?.parts)
    ? etymologyData.parts.filter(
        (part) => Boolean(part?.text) || Boolean(part?.meaning)
      )
    : []

  const hasParts = parts.length > 0
  const hasEtymologyText = Boolean(etymology && etymology.trim().length > 0)

  // derivatives の並びを最低限整える
  const orderedDerivatives = [...derivatives].sort((a, b) => {
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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-gray-900">
              {headword}
            </h1>

            {pronunciation?.audioFile && (
              <button onClick={playAudio}>
                <HiSpeakerWave className="h-5 w-5 text-gray-500" />
              </button>
            )}

            {pronunciation?.phoneticSpelling && (
              <span className="text-gray-500">
                /{pronunciation.phoneticSpelling}/
              </span>
            )}
          </div>

          {onSave && (
            <button onClick={onSave}>
              <HiBookmark
                className={
                  'h-6 w-6 ' +
                  (isBookmarked ? 'text-blue-500' : 'text-gray-300')
                }
              />
            </button>
          )}
        </div>

        {/* MEMORY HOOK */}
        <div className="mt-6 rounded-2xl bg-green-50 p-4">
          <div className="text-2xl font-semibold text-green-700">
            Memory Hook
          </div>

          {/* originLanguage */}
          {originLanguages.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="text-2xl font-semibold text-green-700">
                originLanguage
              </div>

              <div className="flex flex-wrap gap-3">
                {originLanguages.map((language) => (
                  <span
                    key={language}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-1 text-xl text-gray-500"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* parts がある単語 */}
          {hasParts ? (
            <div className="mt-4 flex flex-wrap gap-4">
              {parts.map((part, index) => (
                <div
                  key={`${part.text ?? 'part'}-${index}`}
                  className="flex min-w-[260px] items-center gap-6 rounded-xl bg-green-100 px-4 py-4"
                >
                  <span className="rounded-xl border-2 border-green-500 bg-white px-5 py-1 text-2xl leading-none text-green-600">
                    {part.text}
                  </span>

                  <span className="text-2xl text-green-700">
                    {part.meaning}
                  </span>
                </div>
              ))}
            </div>
          ) : hasEtymologyText ? (
            /* parts がない単語は Oxford etymology 文 */
            <p className="mt-4 text-lg leading-8 text-green-900">
              {etymology}
            </p>
          ) : (
            <p className="mt-4 text-lg leading-8 text-green-900">
              No memory hook available yet.
            </p>
          )}

          {/* derivatives */}
          {orderedDerivatives.length > 0 && (
            <div className="mt-6">
              <div className="text-2xl font-semibold text-green-700">
                derivatives
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
                {orderedDerivatives.map((derivative) => (
                  <span
                    key={derivative}
                    className="text-2xl text-green-700 underline underline-offset-4"
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
                    {POS_LABEL_JA[pos] ?? pos}
                  </span>

                  {grammarTags[pos]?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-gray-100 px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
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

                          {sense.patterns && sense.patterns.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sense.patterns.map((pattern) => (
                                <span
                                  key={pattern}
                                  className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                                >
                                  {pattern}
                                </span>
                              ))}
                            </div>
                          )}

                          {sense.example && (
                            <p className="mt-2 text-gray-600">
                              {sense.example}
                            </p>
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
                              この意味をピン留め
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

        {/* PATTERNS / LEXICAL UNITS */}
        {lexicalUnits.length > 0 && (
          <div className="mt-6 space-y-6 pt-6">
            {detailedLexicalUnits.map((unit) => (
              <LexicalUnitCard
                key={unit.phrase}
                lexicalUnit={unit}
              />
            ))}

            {simpleLexicalUnits.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-gray-400">
                  Lexical Units
                </div>
                <div className="text-gray-800">
                  {simpleLexicalUnits.map((unit) => unit.text).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SYNONYMS */}
        {synonyms.length > 0 && (
          <div className="mt-6">
            <div className="mb-1 text-xs text-gray-400">
              Synonyms
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
              Antonyms
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