'use client'

import { HiSpeakerWave, HiBookmark } from 'react-icons/hi2'
import { POS_LABEL_JA } from '@/lib/pos'
import type { PartOfSpeech } from '@/types/WordInfo'

type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type Sense = {
  meaning: string
  example?: string
  partOfSpeech?: PartOfSpeech | PartOfSpeech[]
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
  patterns?: string[]
  inflections?: string[]
  synonyms?: string[]
  antonyms?: string[]
  grammarTags?: string[]
  isBookmarked: boolean
  onSave?: () => void | Promise<void>
}

export default function EntryCard({
  headword,
  pronunciation,
  etymology,
  senses = {},
  patterns = [],
  inflections = [],
  synonyms = [],
  antonyms = [],
  grammarTags = [],
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

        {/* ===== HEADER ===== */}
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

        {/* ===== INFLECTIONS ===== */}
        {inflections.length > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            {inflections.join(' · ')}
          </div>
        )}

        {/* ===== GRAMMAR TAGS ===== */}
        {grammarTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {grammarTags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* ===== ETYMOLOGY ===== */}
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

{/* ===== SENSES ===== */}
<div className="mt-6 space-y-8">
  {Object.entries(senses).map(([pos, items]) => (
    <div key={pos}>
      
      <div className="mb-3">
        <span className="text-xs border rounded-full px-3 py-1 text-gray-600">
        {POS_LABEL_JA[pos] ?? pos}
        </span>
      </div>

      <div className="space-y-4">
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

        {/* ===== PATTERNS ===== */}
        {patterns.length > 0 && (
          <div className="mt-6 border-t pt-4 space-y-2">
            {patterns.map((p, i) => (
              <div key={i}>
                <span className="underline text-gray-900">
                  {p}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ===== SYNONYMS ===== */}
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

        {/* ===== ANTONYMS ===== */}
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

      </div>
    </div>
  )
}