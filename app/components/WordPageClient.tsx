'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import { supabase } from '@/lib/supabaseClient'
import { apiRequest } from '@/lib/apiClient'
import { wordPrompt } from '@/prompts/word'
import { normalizePOS } from '@/lib/pos'
import { guardQuery, QueryGuardError } from '@/lib/queryGuard'
import { entryFilter, EntryFilterResult } from '@/lib/entryFilter'
import { classifyTypo } from '@/lib/typoClassifier'

/* =========================
 * AI Response
 * ========================= */
type AiResponse = {
  query: string
  normalized: string
  pronunciation?: string
  senses: {
    meaning: string
    partOfSpeech: string | string[]
    example?: string
    translation?: string
  }[]
  etymologyHook?: {
    type: 'A' | 'B' | 'C' | 'D'
    text: string
  }
}

/* =========================
 * AI 呼び出し
 * ========================= */
async function fetchFromAI(prompt: string): Promise<AiResponse> {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
}

/* =========================
 * Component
 * ========================= */
export default function WordPageClient({ word }: { word: string }) {
  const router = useRouter()

  const [entry, setEntry] = useState<{
    query: string
    normalized: string
    pronunciation?: string
    etymologyHook?: AiResponse['etymologyHook']
    senses: WordInfo[]
  } | null>(null)

  const [savedWords, setSavedWords] = useState<string[]>([])
  const [error, setError] = useState<
    QueryGuardError | 'UNSAFE_TO_GENERATE' | null
  >(null)
  const [entryFilterResult, setEntryFilterResult] =
    useState<EntryFilterResult | null>(null)

  const hasGeneratedRef = useRef(false)

  /* =========================
   * 検索語変更時リセット
   * ========================= */
  useEffect(() => {
    setEntry(null)
    setError(null)
    setEntryFilterResult(null)
    hasGeneratedRef.current = false
  }, [word])

  /* =========================
   * 保存済みロード
   * ========================= */
  useEffect(() => {
    const loadSavedWords = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      const list = await fetchWordlists(data.user.id)
      setSavedWords(list.map((w) => w.word))
    }

    loadSavedWords()
  }, [])

  /* =========================
   * AI生成前の上流判定
   * ========================= */
  useEffect(() => {
    if (!word || hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        /* ① guard */
        const guard = await guardQuery(word, 60)
        if (!guard.ok) {
          setError(guard.reason)
          return
        }

        /* ② entryFilter */
        const filtered = await entryFilter(guard.normalized)
        if (!filtered.ok) {
          setEntryFilterResult(filtered)
          return
        }

        /* ③ typoClassifier */
        const typo = await classifyTypo(filtered.normalized)

        if (typo.kind === 'BLOCK') {
          const suggestion = typo.candidates?.[0]
          if (suggestion) {
            router.replace(`/word/${suggestion}`)
          }
          return
        }

        /* ④ AI生成 */
        const response = await fetchFromAI(
          wordPrompt(filtered.normalized)
        )

        setEntry({
          query: response.query,
          normalized: response.normalized,
          pronunciation: response.pronunciation,
          etymologyHook: response.etymologyHook,
          senses: response.senses.slice(0, 4).map((sense) => ({
            word: response.normalized,
            meaning: sense.meaning,
            example: sense.example ?? '',
            translation: sense.translation ?? '',
            partOfSpeech: normalizePOS(sense.partOfSpeech),
          })),
        })
      } catch (err) {
        console.error(err)
        setError('UNSAFE_TO_GENERATE')
      }
    }

    run()
  }, [word, router])

  /* =========================
   * エラー表示
   * ========================= */

  if (error === 'NON_ALPHABET') {
    return <p className="text-red-500">アルファベットのみ入力できます</p>
  }

  if (error === 'TOO_LONG') {
    return <p className="text-red-500">入力が長すぎます</p>
  }

  if (entryFilterResult && !entryFilterResult.ok) {
    return (
      <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          この語は辞書エントリとして生成できません。
        </p>
        {entryFilterResult.note && (
          <p className="mt-1 text-xs text-yellow-700">
            {entryFilterResult.note}
          </p>
        )}
      </div>
    )
  }

  if (!entry) return null

  /* =========================
   * 保存トグル
   * ========================= */
  const handleSave = async () => {
    const isSaved = savedWords.includes(entry.normalized)
    const result = await toggleSaveStatus(
      { word: entry.normalized } as WordInfo,
      isSaved
    )

    if (result.success) {
      setSavedWords((prev) =>
        isSaved
          ? prev.filter((x) => x !== entry.normalized)
          : [...prev, entry.normalized]
      )
    }
  }

  /* =========================
   * Render
   * ========================= */
  return (
    <EntryCard
      headword={entry.normalized}
      isBookmarked={savedWords.includes(entry.normalized)}
      onSave={handleSave}
    >
      {entry.query !== entry.normalized && (
        <p className="text-sm text-gray-500 mb-2">
          検索語：{entry.query}
        </p>
      )}

      {entry.etymologyHook?.text && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-xs font-bold text-green-700">語源フック</span>
          <p className="mt-2 text-green-900">
            {entry.etymologyHook.text}
          </p>
        </div>
      )}

      {entry.senses.map((sense, i) => (
        <WordCard
          key={i}
          word={sense}
          senseIndex={i}
        />
      ))}
    </EntryCard>
  )
}
