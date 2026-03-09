'use client'

import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'
import type { LexicalUnit } from "@/types/LexicalUnit"
import SenceCard from '@/components/SenseCard'

type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type Props = {
  headword: string
  pronunciation?: Pronunciation
  etymology?: string
  senses?: Record<
    string,
    {
      meaning: string
      example?: string
    }[]
  >
  lexicalUnits?: LexicalUnit[]
  inflections?: string[]
  synonyms?: string[]
  derivatives?: string[]
  antonyms?: string[]
  grammarTags?: Record<string, string[]>
  isBookmarked: boolean
  onSave?: () => void | Promise<void>
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
  onSave,
}: Props) {

  const playAudio = () => {
    if (!pronunciation?.audioFile) return
    new Audio(pronunciation.audioFile).play()
  }

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
                  (isBookmarked
                    ? 'text-blue-500'
                    : 'text-gray-300')
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

                {pos === "verb" && inflections.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {inflections.join(' · ')}
                  </span>
                )}

                <div className="space-y-4 mt-4">
                  {items.map((sense, i) => (
                    <div key={i}>

                      <p className="text-gray-900">
                        <span className="font-semibold mr-2">
                          {i + 1}.
                        </span>
                        {sense.meaning}
                      </p>

                      {sense.example && (
                        <p className="mt-2 italic text-gray-600">
                          {sense.example}
                        </p>
                      )}

                    </div>
                  ))}
                </div>

              </div>
            ))}
        </div>

        {/* PATTERNS */}
        {lexicalUnits.length > 0 && (
          <div className="mt-6 pt-6 space-y-6">

            {lexicalUnits.map((unit: LexicalUnit, i: number) => (
              <SenceCard
                key={unit.phrase}
                sense={{
                  pattern: unit.phrase,
                  meaning: unit.meanings?.[0]?.meaning?.en ?? "",
                  example: unit.meanings?.[0]?.examples?.[0]?.sentence ?? "",
                  translation: unit.meanings?.[0]?.examples?.[0]?.translation ?? "",
                }}
                senseIndex={i}
              />
            ))}

          </div>
        )}

        {/* SYNONYMS */}
        {synonyms.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-gray-400 mb-1">
              Synonyms
            </div>
            <div className="text-gray-800">
              {synonyms.slice(0,8).join(', ')}
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
              {antonyms.slice(0,8).join(', ')}
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