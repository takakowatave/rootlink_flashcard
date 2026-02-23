'use client'

import { useEffect, useMemo, useState } from 'react'
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
  etymologyHook?: {
    type: 'A' | 'B' | 'C'
    summary: string
    hookJa: string
    parts?: {
      part: string
      meaning: string
      relatedWords: string[]
    }[]
  }
}

export default function WordPageClient({
  word,
  dictionary,
}: {
  word: string
  dictionary: any
}) {
  /* =========================
     ① 辞書からsense固定抽出
  ========================= */
  const dictionarySenses = useMemo(() => {
    if (!dictionary?.[0]?.meanings) return []

    const result: any[] = []

    for (const m of dictionary[0].meanings) {
      const pos = normalizePOS(m.partOfSpeech)
      const firstDef = m.definitions?.[0]
      if (!firstDef) continue

      result.push({
        word,
        meaning: firstDef.definition, // 英語定義は固定
        example: firstDef.example ?? '',
        translation: '',
        partOfSpeech: pos,
      })

      if (result.length >= 3) break
    }

    return result
  }, [dictionary, word])

  /* =========================
     ② 語源だけAI
  ========================= */
  const {
    data: etymology,
    loading,
    error,
  } = useAiEntry<AiResponse>({
    prompt: word ? wordPrompt(word, dictionary ?? {}) : '',
  })

  const [savedWords, setSavedWords] = useState<string[]>([])

  useEffect(() => {
    const loadSavedWords = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const list = await fetchWordlists(data.user.id)
      setSavedWords(list.map((w) => w.word))
    }
    loadSavedWords()
  }, [])

  const entry = useMemo(() => {
    if (!etymology) return null

    return {
      query: etymology.query,
      normalized: etymology.normalized,
      pronunciation: etymology.pronunciation,
      etymologyHook: etymology.etymologyHook,
      senses: dictionarySenses,
    }
  }, [etymology, dictionarySenses])

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
     Render
  ========================= */
  return (
    <>
      {loading && <p className="p-4">Loading...</p>}
      {error && <p className="p-4 text-red-500">AI error</p>}

      {entry && (
        <EntryCard
          headword={entry.normalized}
          pronunciation={{ lang: 'en-GB' }}
          isBookmarked={savedWords.includes(entry.normalized)}
          onSave={handleSave}
        >
          {entry.query !== entry.normalized && (
            <p className="text-sm text-gray-500 mb-2">
              検索語：{entry.query}
            </p>
          )}

          {entry.etymologyHook && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <span className="text-xs font-bold text-green-700">
                語源
              </span>
              <p className="mt-2 text-green-900">
                {entry.etymologyHook.summary ||
                  entry.etymologyHook.hookJa}
              </p>
            </div>
          )}

          {entry.senses.map((sense: any, i: number) => (
            <WordCard key={i} word={sense} senseIndex={i} />
          ))}
        </EntryCard>
      )}
    </>
  )
}