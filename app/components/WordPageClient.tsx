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
export default function WordPageClient({ word }: { word: string }) {
  const [viewWords, setViewWords] = useState<WordWithType[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 🔒 検索語ごとの二重生成防止
  const hasGeneratedRef = useRef(false)

  /* =========================
   * 検索語変更時のリセット
   * ========================= */
  useEffect(() => {
    console.log('🔁 word changed:', word)

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
   * AI 生成（検索語ごとに1回）
   * ========================= */
  useEffect(() => {
    if (!word) return
    if (hasGeneratedRef.current) return

    hasGeneratedRef.current = true

    const run = async () => {
      try {
        /* ---------- ① 入り口：最終プロンプト ---------- */
        const prompt = wordPrompt(word)
        console.log('🟢 PROMPT (final):', prompt)

        /* ---------- AI 呼び出し ---------- */
        const response = await fetchFromAI(prompt)


        const result: WordWithType[] = [
          {
            word, // URL の word を必ず使う
            meaning: response.main.meaning,
            example: response.main.example,
            translation: response.main.translation,
            pronunciation: response.main.pronunciation,
            partOfSpeech: normalizePOS(response.main.partOfSpeech),
            type: 'main',
          },
          ...(response.related.synonyms ?? []).map((w) => ({
            word: w,
            meaning: '',
            example: '',
            translation: '',
            pronunciation: '',
            partOfSpeech: [],
            type: 'synonym' as const,
          })),
          ...(response.related.antonyms ?? []).map((w) => ({
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
      } catch (err) {
        console.error('❌ AI generation failed:', err)
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
