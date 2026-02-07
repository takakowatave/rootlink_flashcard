'use client'

import { useEffect, useRef, useState } from 'react'
import { apiRequest } from '@/lib/apiClient'
import { lexicalUnit } from '@/prompts/lexicalUnit'
import type { LexicalUnitType } from '@/types/LexicalUnit'
import { LEXICAL_UNIT_LABEL_JA } from '@/types/LexicalUnit'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import type { WordInfo } from '@/types/WordInfo'
import { guardQuery, QueryGuardError } from '@/lib/queryGuard'

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
  const [data, setData] = useState<{
    phrase: string
    lexicalUnitType: LexicalUnitType
    meanings: ApiResponse['meanings']
    coreImage?: ApiResponse['coreImage']
  } | null>(null)

  const [error, setError] = useState<QueryGuardError | null>(null)
  const hasGeneratedRef = useRef(false)
  const phrase = slug.replace(/-/g, ' ')

  useEffect(() => {
    setData(null)
    setError(null)
    hasGeneratedRef.current = false
  }, [slug])

  useEffect(() => {
    if (hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        // 🔒 ① 共通ガード（ここが追加点）
        const guard = await guardQuery(phrase, 60)
        if (!guard.ok) {
          setError(guard.reason)
          return
        }

        // 🔽 正規化された文字列を使う
        const result = await fetchFromAI(lexicalUnit(guard.normalized))

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
        setError('NOT_EXIST')
      }
    }

    run()
  }, [phrase])

  // ===== エラー表示（EntryCardは出さない） =====
  if (error === 'NON_ALPHABET') {
    return <p className="text-red-500">アルファベットのみ入力できます</p>
  }

  if (error === 'TOO_LONG') {
    return <p className="text-red-500">入力が長すぎます</p>
  }

  if (error === 'NOT_EXIST') {
    return <p className="text-red-500">英語の熟語として確認できませんでした</p>
  }

  if (!data) return null

  return (
    <EntryCard
      headword={data.phrase}
      isBookmarked={false}
      pronunciation={{ lang: 'en-GB' }}
    >
      {/* 品詞タグ */}
      <span className="inline-block text-xs rounded-full px-2 py-1 bg-gray-100 mb-4">
        {LEXICAL_UNIT_LABEL_JA[data.lexicalUnitType]}
      </span>

      {/* 語源フック / コアイメージ */}
      {data.coreImage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-700 mb-1">
            {data.coreImage.type === 'etymology' ? '語源フック' : 'コアイメージ'}
          </p>
          <p className="text-sm text-green-900">
            {data.coreImage.text}
          </p>
        </div>
      )}

      {/* 意味 */}
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
