'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/apiClient'
import { lexicalUnit } from '@/prompts/lexicalUnit'
import type { LexicalUnitType } from '@/types/LexicalUnit'
import { LEXICAL_UNIT_LABEL_JA } from '@/types/LexicalUnit'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import SearchForm from '@/components/search-form'
import type { WordInfo } from '@/types/WordInfo'
import { guardQuery, QueryGuardError } from '@/lib/queryGuard'
import { classifyTypo } from '@/lib/typoClassifier'

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

async function fetchFromAI(prompt: string): Promise<ApiResponse> {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
}

export default function LexicalUnitPageClient({ slug }: { slug: string }) {
  const router = useRouter()

  const phrase = slug.replace(/-/g, ' ')
  const [query, setQuery] = useState(phrase)

  const [data, setData] = useState<{
    phrase: string
    lexicalUnitType: LexicalUnitType
    meanings: ApiResponse['meanings']
    coreImage?: ApiResponse['coreImage']
  } | null>(null)

  const [error, setError] = useState<QueryGuardError | null>(null)

  const hasGeneratedRef = useRef(false)

  /* =========================
     slug変更時リセット
  ========================= */
  useEffect(() => {
    setQuery(phrase)
    setData(null)
    setError(null)
    hasGeneratedRef.current = false
  }, [slug, phrase])

  /* =========================
    上流判定 + AI生成
  ========================= */
  useEffect(() => {
    if (hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        /* ① guard */
        const guard = await guardQuery(phrase, 60)
        if (!guard.ok) {
          setError(guard.reason)
          return
        }

        /* ② typoClassifier */
        const typo = await classifyTypo(guard.normalized)

        if (typo.kind === 'BLOCK') {
          const suggestion = typo.candidates?.[0]
          if (suggestion) {
            router.replace(
              `/lexical-unit/${suggestion.replace(/\s+/g, '-')}`
            )
          }
          return
        }

        /* ③ AI生成 */
        const result = await fetchFromAI(
          lexicalUnit(guard.normalized)
        )

        setData({
          phrase: guard.normalized,
          lexicalUnitType:
            result.lexicalUnitType ??
            result.lexical_unit_type ??
            'phrasal_verb',
          meanings: result.meanings ?? [],
          coreImage: result.coreImage,
        })
      } catch (e) {
        console.error(e)
      }
    }

    run()
  }, [phrase, router])

  /* =========================
    エラー表示
  ========================= */

  if (error === 'NON_ALPHABET') {
    return <p className="text-red-500">アルファベットのみ入力できます</p>
  }

  if (error === 'TOO_LONG') {
    return <p className="text-red-500">入力が長すぎます</p>
  }

  if (!data) return null

  const handleSubmit = () => {
    const next = query.trim()
    if (!next) return
    router.push(`/lexical-unit/${next.replace(/\s+/g, '-')}`)
  }

  /* =========================
     Render
  ========================= */
  return (
    <EntryCard
      headword={data.phrase}
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
        {LEXICAL_UNIT_LABEL_JA[data.lexicalUnitType]}
      </span>

      {data.coreImage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-700 mb-1">
            {data.coreImage.type === 'etymology'
              ? '語源フック'
              : 'コアイメージ'}
          </p>
          <p className="text-sm text-green-900">
            {data.coreImage.text}
          </p>
        </div>
      )}

      {data.meanings.map((m, i) => {
        const wordInfo: WordInfo = {
          word: data.phrase,
          meaning: m.meaning,
          example: m.examples?.[0]?.sentence ?? '',
          translation: m.examples?.[0]?.translation ?? '',
          partOfSpeech: [],
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
