'use client'

import { useEffect, useRef, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import { supabase } from '@/lib/supabaseClient'
import { apiRequest } from '@/lib/apiClient'
import { wordPrompt } from '@/prompts/word'
import { normalizePOS } from '@/lib/pos'

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
  const [entry, setEntry] = useState<{
    query: string
    normalized: string
    pronunciation?: string
    etymologyHook?: AiResponse['etymologyHook']
    senses: WordInfo[]
  } | null>(null)

  const [savedWords, setSavedWords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const hasGeneratedRef = useRef(false)

  /* =========================
   * 検索語変更時リセット
   * ========================= */
  useEffect(() => {
    setEntry(null)
    setError(null)
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
   * AI生成
   * ========================= */
  useEffect(() => {
    if (!word || hasGeneratedRef.current) return
    hasGeneratedRef.current = true

    const run = async () => {
      try {
        const response = await fetchFromAI(wordPrompt(word))

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
        setError('AIの結果を取得できませんでした')
      }
    }

    run()
  }, [word])

  /* =========================
   * 保存トグル
   * ========================= */
  const handleSave = async () => {
    if (!entry) return
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
  if (error) return <p className="text-red-500">{error}</p>
  if (!entry) return null

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
