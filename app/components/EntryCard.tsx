'use client'

// wordページ全体のレイアウト
// header / etymology / senses / lexicalUnits / synonyms などの sections を並べる
// 各 section に適切な子コンポーネントを渡す


import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit } from '@/types/LexicalUnit'
import SenceCard from '@/components/SenseCard'
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

type Props = {
  headword: string
  pronunciation?: Pronunciation
  etymology?: string
  senses?: Record<
    string,
    {
      senseId: string
      meaning: string
      example?: string
      patterns?: string[]
    }[]
  >
  lexicalUnits?: (LexicalUnit | SimpleLexicalUnit)[]
  inflections?: string[]
  synonyms?: string[]
  derivatives?: string[]
  antonyms?: string[]
  grammarTags?: Record<string, string[]>
  isBookmarked: boolean
  onSave?: () => void | Promise<void>

  // pin 用
  pinnedSenseId: string | null
  onTogglePin: (senseId: string) => void
}

export default function EntryCard({
  headword,
  pronunciation,
  etymology,
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
  const playAudio = () => {
    if (!pronunciation?.audioFile) return
    new Audio(pronunciation.audioFile).play()
  }

  const isDetailedLexicalUnit = (
    unit: LexicalUnit | SimpleLexicalUnit
  ): unit is LexicalUnit => {
    return 'phrase' in unit
  }

  const isSimpleLexicalUnit = (
    unit: LexicalUnit | SimpleLexicalUnit
  ): unit is SimpleLexicalUnit => {
    return 'text' in unit
  }

  // lexical phrase を anchor 用 id に変換
  const toLexicalAnchorId = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const detailedLexicalUnits = lexicalUnits.filter(isDetailedLexicalUnit)
  const simpleLexicalUnits = lexicalUnits.filter(isSimpleLexicalUnit)

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4">
      <div className="rounded-2xl bg-white p-6">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold text-gray-900">
              {headword}
            </h1>

            {pronunciation?.audioFile && (
              <button onClick={playAudio}>
                <HiSpeakerWave className="w-5 h-5 text-gray-500" />
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
                  'w-6 h-6 ' +
                  (isBookmarked ? 'text-blue-500' : 'text-gray-300')
                }
              />
            </button>
          )}
        </div>

        {/* ETYMOLOGY */}
        {etymology && (
          <div className="mt-6 bg-green-50 rounded-xl p-4">
            <div className="text-green-700 font-semibold text-sm">
              Etymology
            </div>
            <p className="mt-2 text-green-900">
              {etymology}
            </p>
          </div>
        )}

        {/* SENSES */}
        <div className="mt-6 space-y-8">
          {Object.entries(senses)
            .filter(([, items]) => items.length > 0)
            .map(([pos, items]) => (
              <div key={pos}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs rounded-full border px-3 py-1 text-gray-600">
                    {POS_LABEL_JA[pos] ?? pos}
                  </span>

                  {grammarTags[pos]?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
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

                <div className="space-y-4 mt-4">
                  {items.map((sense, i) => {
                    const isPinned = pinnedSenseId === sense.senseId

                    return (
                      <div
                        key={sense.senseId}
                        className="group flex items-start justify-between gap-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-900">
                          {sense.meaning}
                          </p>

                          {sense.patterns && sense.patterns.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {sense.patterns.map((pattern) => (
                                <span
                                  key={pattern}
                                  className="text-xs rounded-full bg-gray-100 px-2 py-1 text-gray-600"
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

                        <div className="relative shrink-0 group/pin">
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
                            <span className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-gray-700 px-4 py-3 text-sm text-white opacity-0 shadow-md transition-opacity group-hover/pin:opacity-100">
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
          <div className="mt-6 pt-6 space-y-6">
            {detailedLexicalUnits.map((unit) => (
              <LexicalUnitCard
                key={unit.phrase}
                lexicalUnit={unit}
              />
            ))}

            {simpleLexicalUnits.length > 0 && (
              <div>
                <div className="text-xs text-gray-400 mb-1">
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
            <div className="text-xs text-gray-400 mb-1">
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
            <div className="text-xs text-gray-400 mb-1">
              Antonyms
            </div>
            <div className="text-gray-800">
              {antonyms.slice(0, 8).join(', ')}
            </div>
          </div>
        )}

        {derivatives.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-1">
              Derivatives
            </div>
            <div className="text-gray-800">
              {derivatives.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}