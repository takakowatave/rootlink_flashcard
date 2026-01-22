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
 * AI Response 型
 * ========================= */
type AiResponse = {
  main: {
    word: string
    meaning: string
    partOfSpeech: string | string[]
    pronunciation: string
    example: string
    translation: string
  }
  related: {
    synonyms: string[]
    antonyms: string[]
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
export default function WordPageClient({
  word,
}: {
  word: string
}) {
  const [viewWords, setViewWords] = useState<WordWithType[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 🔒 二重実行防止
  const hasGeneratedRef = useRef(false)

  /* =========================
   * 検索語が変わったら完全リセット
   * ========================= */
  useEffect(() => {
    setViewWords([])
    setError(null)
    hasGeneratedRef.current = false
  }, [word])

  /* =========================
   * 保存済み単語ロード（1回）
   * ========================= */
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const list = await fetchWordlists(data.user.id)
      setSavedWords(list.map((w) => w.word))
    }
    load()
  }, [])

  /* =========================
   * AI生成（wordごとに1回）
   * ========================= */
  useEffect(() => {
    if (!word) return
    if (hasGeneratedRef.current) return

    hasGeneratedRef.current = true

    const run = async () => {
      try {
        const base = await fetchFromAI(wordPrompt(word))
        console.log('[AI response]', base)

        const result: WordWithType[] = [
          {
            word, // ← 必ずURLのword
            meaning: base.main.meaning,
            example: base.main.example,
            translation: base.main.translation,
            pronunciation: base.main.pronunciation,
            partOfSpeech: normalizePOS(base.main.partOfSpeech),
            type: 'main' as const,
          },
          ...(base.related.synonyms ?? []).map((w) => ({
            word: w,
            meaning: '',
            example: '',
            translation: '',
            pronunciation: '',
            partOfSpeech: [],
            type: 'synonym' as const,
          })),
          ...(base.related.antonyms ?? []).map((w) => ({
            word: w,
            meaning: '',
            example: '',
            translation: '',
            pronunciation: '',
            partOfSpeech: [],
            type: 'antonym' as const,
          })),
        ]

        setViewWords(result)
      } catch (e) {
        console.error(e)
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

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <main className="w-full">
      {viewWords.map((w) => (
        <WordCard
          key={`${w.word}-${w.type}`}
          word={w}
          savedWords={savedWords}
          onSave={handleSave}
        />
      ))}
    </main>
  )
}
