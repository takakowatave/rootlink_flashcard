'use client'

import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { lexicalUnit } from '@/prompts/lexicalUnit'
import type { LexicalUnit, LexicalUnitType } from '@/types/LexicalUnit'
import { LEXICAL_UNIT_LABEL_JA } from '@/types/LexicalUnit'

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
  const [lexicalUnitData, setLexicalUnitData] = useState<LexicalUnit | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasGeneratedRef = useRef(false)
  const phrase = slug.replace(/-/g, ' ')

  useEffect(() => {
    setLexicalUnitData(null)
    setError(null)
    hasGeneratedRef.current = false
  }, [slug])

  useEffect(() => {
    if (hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        const prompt = lexicalUnit(phrase)
        const result = await fetchFromAI(prompt)

        setLexicalUnitData({
          phrase,
          lexicalUnitType:
            result.lexicalUnitType ??
            result.lexical_unit_type ??
            'phrasal_verb',
          meanings: result.meanings ?? [],
          coreImage: result.coreImage,
        })
      } catch (e) {
        console.error(e)
        setError('Failed to generate entry')
      }
    }

    run()
  }, [phrase])

  if (error) return <p className="text-red-500">{error}</p>
  if (!lexicalUnitData) return null

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-bold">{lexicalUnitData.phrase}</h1>

      {/* 品詞タグ */}
      <span className="inline-block text-xs rounded-full px-2 py-1 bg-gray-100">
        {LEXICAL_UNIT_LABEL_JA[lexicalUnitData.lexicalUnitType]}
      </span>

      {/* 🟢 コアイメージ / 語源フック */}
      {lexicalUnitData.coreImage && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-700 mb-1">
            {lexicalUnitData.coreImage.type === 'etymology'
              ? '語源フック'
              : 'コアイメージ'}
          </p>
          <p className="text-sm text-green-900">
            {lexicalUnitData.coreImage.text}
          </p>
        </div>
      )}

      {/* 意味一覧 */}
      {lexicalUnitData.meanings.map((m, index) => (
        <section key={m.id} className="space-y-2">
          <p className="font-medium">
            {index + 1}. {m.meaning}
          </p>

          <ul className="space-y-1">
            {m.examples.map((ex, i) => (
              <li key={i}>
                <div>{ex.sentence}</div>
                <div className="text-sm text-gray-600">
                  {ex.translation}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
