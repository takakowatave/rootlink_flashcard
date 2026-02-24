'use client'

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/WordCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import type { WordInfo } from '@/types/WordInfo'
import { supabase } from '@/lib/supabaseClient'
import { normalizePOS } from '@/lib/pos'

export default function WordPageClient({
  word,
  dictionary,
}: {
  word: string
  dictionary: any
}) {
  /* =========================
     ① Oxfordからsense抽出
  ========================= */
  const dictionarySenses = useMemo(() => {
    const result: any[] = []

    const lexicalEntries =
      dictionary?.results?.[0]?.lexicalEntries ?? []

    for (const lexical of lexicalEntries) {
      const pos = normalizePOS(lexical.lexicalCategory?.text)

      for (const entry of lexical.entries ?? []) {
        for (const sense of entry.senses ?? []) {
          const definition = sense.definitions?.[0]
          if (!definition) continue

          result.push({
            word,
            meaning: definition,
            example: sense.examples?.[0]?.text ?? '',
            translation: '',
            partOfSpeech: pos,
          })

          if (result.length >= 3) return result
        }
      }
    }

    return result
  }, [dictionary, word])

  /* =========================
     ② Oxfordから語源抽出（生）
  ========================= */
  const rawEtymology = useMemo(() => {
    return (
      dictionary?.results?.[0]?.lexicalEntries?.[0]?.entries?.[0]
        ?.etymologies?.[0] ?? ''
    )
  }, [dictionary])

  /* =========================
     ③ entry構築
  ========================= */
  const entry = useMemo(() => {
    if (!dictionary) return null

    return {
      query: word,
      normalized: word,
      etymology: rawEtymology,
      senses: dictionarySenses,
    }
  }, [dictionary, dictionarySenses, rawEtymology, word])

  /* =========================
     ④ 保存処理
  ========================= */
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
      {entry && (
        <EntryCard
          headword={entry.normalized}
          pronunciation={{ lang: 'en-GB' }}
          isBookmarked={savedWords.includes(entry.normalized)}
          onSave={handleSave}
        >
          {entry.etymology && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <span className="text-xs font-bold text-green-700">
                Etymology
              </span>
              <p className="mt-2 text-green-900">
                {entry.etymology}
              </p>
            </div>
          )}

          {entry.senses.map((sense: any, i: number) => (
            <WordCard key={i} sense={sense} senseIndex={i} />
          ))}
        </EntryCard>
      )}
    </>
  )
}