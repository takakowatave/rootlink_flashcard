'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lexicalUnit } from '@/prompts/lexicalUnit'
import type { LexicalUnitType } from '@/types/LexicalUnit'
import { LEXICAL_UNIT_LABEL_JA } from '@/types/LexicalUnit'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import SearchForm from '@/components/search-form'
import type { WordInfo } from '@/types/WordInfo'
import { useAiEntry } from '@/lib/useAiEntry'

type ApiResponse = {
  lexical_unit_type?: LexicalUnitType
  lexicalUnitType?: LexicalUnitType
  meanings: {
    id: number
    meaning: string
    examples: { sentence: string; translation: string }[]
  }[]
  coreImage?: {
    type: 'etymology' | 'core_image'
    text: string
  }
}

export default function LexicalUnitPageClient({ slug }: { slug: string }) {
  const router = useRouter()

  const phrase = slug.replace(/-/g, ' ')
  const [query, setQuery] = useState(phrase)

  const { data, loading, error } = useAiEntry<ApiResponse>({
    prompt: lexicalUnit(phrase)
  })

  useEffect(() => {
    setQuery(phrase)
  }, [slug, phrase])

  if (loading) return <p>読み込み中...</p>
  if (error) return <p className="text-red-500">エラーが発生しました</p>
  if (!data) return null

  const result = {
    phrase: phrase,
    lexicalUnitType: data.lexicalUnitType ?? data.lexical_unit_type ?? 'phrasal_verb',
    meanings: data.meanings ?? [],
    coreImage: data.coreImage,
  }

  const handleSubmit = () => {
    const next = query.trim()
    if (!next) return
    router.push(`/lexical-unit/${next.replace(/\s+/g, '-')}`)
  }

  return (
    <EntryCard
      headword={result.phrase}
      isBookmarked={false}
      pronunciation={{ lang: 'en-GB' }}
      searchForm={
        <SearchForm
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
        />
      }
    >
      <span className="inline-block text-xs rounded-full px-2 py-1 bg-gray-100 mb-4">
        {LEXICAL_UNIT_LABEL_JA[result.lexicalUnitType]}
      </span>

      {result.coreImage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-700 mb-1">
            {result.coreImage.type === 'etymology'
              ? '語源フック'
              : 'コアイメージ'}
          </p>
          <p className="text-sm text-green-900">
            {result.coreImage.text}
          </p>
        </div>
      )}

      {result.meanings.map((m, i) => {
        const wordInfo: WordInfo = {
          word: result.phrase,
          meaning: m.meaning,
          example: m.examples?.[0]?.sentence ?? '',
          translation: m.examples?.[0]?.translation ?? '',
        }

        return (
          <WordCard
            key={m.id ?? i}
            word={wordInfo}
            senseIndex={i}
          />
        )
      })}
    </EntryCard>
  )
}
