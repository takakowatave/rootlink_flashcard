'use client'

import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { lexicalUnit } from '@/prompts/lexicalUnit'
import type { LexicalUnit, LexicalUnitType } from '@/types/LexicalUnit'
import { LEXICAL_UNIT_LABEL_JA } from '@/types/LexicalUnit'

type ApiResponse = {
  lexical_unit_type?: LexicalUnitType
  lexicalUnitType?: LexicalUnitType
  meaning: string
  examples: { sentence: string; translation: string }[]
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

  // slug → phrase
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
            'idiom',
          meaning: result.meaning,
          examples: result.examples.slice(0, 3),
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
    <main className="space-y-4">
      <h1 className="text-xl font-bold">
        {lexicalUnitData.phrase}
      </h1>

      {/* 日本語タグ表示 */}
      <span className="inline-block text-xs rounded-full px-2 py-1 bg-gray-100">
        {LEXICAL_UNIT_LABEL_JA[lexicalUnitData.lexicalUnitType]}
      </span>

      <p>{lexicalUnitData.meaning}</p>

      <ul className="space-y-2">
        {lexicalUnitData.examples.map((ex, i) => (
          <li key={i}>
            <div>{ex.sentence}</div>
            <div className="text-sm text-gray-600">
              {ex.translation}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
