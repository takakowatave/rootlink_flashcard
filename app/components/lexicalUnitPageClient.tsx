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
import { entryFilter, EntryFilterResult } from '@/lib/entryFilter'

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

  // queryGuard.ts 用（「ここで止めていい」エラー）
  const [error, setError] = useState<QueryGuardError | null>(null)

  // entryFilter.ts 用（「生成してはいけない」状態）
  const [entryFilterResult, setEntryFilterResult] =
    useState<EntryFilterResult | null>(null)

  const hasGeneratedRef = useRef(false)
  const phrase = slug.replace(/-/g, ' ')

  useEffect(() => {
    setData(null)
    setError(null)
    setEntryFilterResult(null)
    hasGeneratedRef.current = false
  }, [slug])

  useEffect(() => {
    if (hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        // 🔒 ① client-side guard（構文のみ・止めてよい）
        const guard = await guardQuery(phrase, 60)
        if (!guard.ok) {
          setError(guard.reason)
          return
        }

        // 🔎 ② entryFilter（止めないが、生成を抑制する）
        const filtered = entryFilter(guard.normalized)
        if (!filtered.ok) {
          // 正規エントリとしては生成しない
          setEntryFilterResult(filtered)
          return
        }

        // ⬇️ ③ ここを通ったものだけ AI に投げる
        const result = await fetchFromAI(
          lexicalUnit(filtered.normalized)
        )

        setData({
          phrase: filtered.normalized,
          lexicalUnitType:
            result.lexicalUnitType ??
            result.lexical_unit_type ??
            'phrasal_verb',
          meanings: result.meanings ?? [],
          coreImage: result.coreImage,
        })
      } catch (e) {
        console.error(e)
        // 通信・生成エラーは UI では握りつぶす
      }
    }

    run()
  }, [phrase])

  // ===== queryGuard 由来のエラー表示（完全に止める） =====
  if (error === 'NON_ALPHABET') {
    return <p className="text-red-500">アルファベットのみ入力できます</p>
  }

  if (error === 'TOO_LONG') {
    return <p className="text-red-500">入力が長すぎます</p>
  }

  // ===== entryFilter 由来（生成はしないが検索体験は続行） =====
  if (entryFilterResult && !entryFilterResult.ok) {
    return (
      <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          この語は辞書の正規エントリとして生成できません。
        </p>
        {entryFilterResult.note && (
          <p className="mt-1 text-xs text-yellow-700">
            {entryFilterResult.note}
          </p>
        )}
      </div>
    )
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
