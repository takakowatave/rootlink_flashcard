'use client'

import { useEffect, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import { supabase } from '@/lib/supabaseClient'
import { wordPrompt } from '@/prompts/word'
import { normalizePOS } from '@/lib/pos'
import { useAiEntry } from '@/lib/useAiEntry'

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
    hook_ja: string
    parts?: unknown[]
  }
}

export default function WordPageClient({ word }: { word: string }) {

  /* =========================
     AI呼び出し
  ========================= */
  const { data: response, loading, error } =
    useAiEntry<AiResponse>({
      prompt: word ? wordPrompt(word) : ''
    })

  const [savedWords, setSavedWords] = useState<string[]>([])

  /* =========================
     保存済みロード
  ========================= */
  useEffect(() => {
    const loadSavedWords = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      const list = await fetchWordlists(data.user.id)
      setSavedWords(list.map((w) => w.word))
    }

    loadSavedWords()
  }, [])

  if (loading) return <p className="p-4">Loading...</p>

  if (error) {
    console.error('AI ERROR:', error)
    return <p className="p-4 text-red-500">AI error</p>
  }

  if (!response) {
    console.error('NO RESPONSE')
    return <p className="p-4 text-red-500">No response</p>
  }

  /* =========================
     データ整形
  ========================= */
  const entry = {
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
  }

  /* =========================
     保存トグル
  ========================= */
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
     Render
  ========================= */
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

      {/* ===== 語源フック表示（hook_jaに変更） ===== */}
      {entry.etymologyHook?.hook_ja && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <span className="text-xs font-bold text-green-700">
            語源フック
          </span>
          <p className="mt-2 text-green-900">
            {entry.etymologyHook.hook_ja}
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