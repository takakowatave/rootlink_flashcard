'use client'

import { useEffect, useRef, useState } from 'react'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import type { WordWithType } from '@/types/WordWithType'
import { supabase } from '@/lib/supabaseClient'
import { apiRequest } from '@/lib/apiClient'
import { wordPrompt } from '@/prompts/word'
import { normalizePOS } from '@/lib/pos'

/* =========================
 * AI Response 型（sense前提）
 * ========================= */
type AiResponse = {
  query: string
  normalized: string
  senses: {
    meaning: string
    partOfSpeech: string | string[]
    pronunciation?: string
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
  const [viewWords, setViewWords] = useState<WordWithType[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const hasGeneratedRef = useRef(false)

  /* =========================
   * 検索語変更時のリセット
   * ========================= */
  useEffect(() => {
    setViewWords([])
    setError(null)
    hasGeneratedRef.current = false
  }, [word])

  /* =========================
   * 保存済み単語ロード（初回のみ）
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
   * AI生成（検索語ごとに1回）
   * ========================= */
  useEffect(() => {
    if (!word) return
    if (hasGeneratedRef.current) return

    hasGeneratedRef.current = true

    const run = async () => {
      try {
        const prompt = wordPrompt(word)
        const response = await fetchFromAI(prompt)

        const senses = (response.senses ?? []).slice(0, 4)

        const result: WordWithType[] = senses.map((sense, index) => ({
          word: response.normalized || word,
          meaning: sense.meaning,
          example: sense.example ?? '',
          translation: sense.translation ?? '',
          pronunciation: sense.pronunciation ?? '',
          partOfSpeech: normalizePOS(sense.partOfSpeech),
        
          etymologyHook: response.etymologyHook
            ? {
                type: response.etymologyHook.type ?? 'A',
                text: response.etymologyHook.text,
              }
            : undefined,
        
          type: 'main',
          senseIndex: index,
        }))
        

        setViewWords(result)
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
  const handleSave = async (w: WordInfo) => {
    const isSaved = savedWords.includes(w.word)
    const result = await toggleSaveStatus(w, isSaved)

    if (result.success) {
      setSavedWords((prev) =>
        isSaved ? prev.filter((x) => x !== w.word) : [...prev, w.word]
      )
    }
  }

  /* =========================
   * Render
   * ========================= */
  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (viewWords.length === 0) return null

  return (
    <main className="w-full space-y-4">
      {viewWords.map((w, i) => (
        <WordCard
          key={`${w.word}-${i}`}
          word={w}
          savedWords={savedWords}
          onSave={handleSave}
          isFirst={i === 0}      // 👈 見出し語は1回だけ
          senseIndex={i}        // 👈 ①②③ 用
        />
      ))}
    </main>
  )
}
