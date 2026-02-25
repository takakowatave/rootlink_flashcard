'use client'

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import WordCard from '@/components/SenceCard'
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
   ① Senses抽出（品詞ごとにまとめる）
========================= */
const senses = useMemo(() => {
  type SenseItem = {
    meaning: string
    example?: string
  }

  const grouped: Record<string, SenseItem[]> = {}

  const lexicalEntries =
    dictionary?.results?.[0]?.lexicalEntries ?? []

  for (const lexical of lexicalEntries) {
    const posRaw = normalizePOS(lexical.lexicalCategory?.text)
    if (!posRaw) continue

    const posList = Array.isArray(posRaw) ? posRaw : [posRaw]

    for (const pos of posList) {

      if (!grouped[pos]) {
        grouped[pos] = []
      }

      for (const entry of lexical.entries ?? []) {
        for (const sense of entry.senses ?? []) {
          const definition = sense.definitions?.[0]
          if (!definition) continue

          grouped[pos].push({
            meaning: definition,
            example: sense.examples?.[0]?.text ?? '',
          })

          for (const sub of sense.subsenses ?? []) {
            const subDef = sub.definitions?.[0]
            if (!subDef) continue

            grouped[pos].push({
              meaning: subDef,
              example: sub.examples?.[0]?.text ?? '',
            })
          }
        }
      }
    }
  }

  return grouped
}, [dictionary])

  /* =========================
     ② Patterns抽出
  ========================= */
  const patterns = useMemo(() => {
    const set = new Set<string>()
  
    const lexicalEntries =
      dictionary?.results?.[0]?.lexicalEntries ?? []
  
    const target = word.toLowerCase()
  
    for (const lexical of lexicalEntries) {
      for (const entry of lexical.entries ?? []) {
        for (const sense of entry.senses ?? []) {
  
          // ① constructions
          sense.constructions?.forEach((c: any) => {
            if (c.text) set.add(c.text)
          })
  
          // ② notes
          sense.notes?.forEach((note: any) => {
            if (note.type === 'wordFormNote' && note.text) {
              set.add(note.text)
            }
          })
  
          // ③ examples 解析（追加）
          sense.examples?.forEach((ex: any) => {
            if (!ex.text) return
  
            const text = ex.text.toLowerCase()
  
            // word + preposition 抽出
            const regex = new RegExp(
              `\\b${target}\\s+(with|to|on|about|for|of|in|at|from)\\b`,
              'g'
            )
  
            const matches = text.match(regex)
            if (matches) {
              matches.forEach((m: string) => set.add(m))
            }
          })
        }
      }
    }
  
    return Array.from(set)
  }, [dictionary, word])
  /* =========================
     ③ 語源
  ========================= */
  const etymology =
    dictionary?.results?.[0]?.lexicalEntries?.[0]?.entries?.[0]
      ?.etymologies?.[0] ?? ''

  /* =========================
     ④ 保存処理
  ========================= */
  const [savedWords, setSavedWords] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const list = await fetchWordlists(data.user.id)
      setSavedWords(list.map((w) => w.word))
    }
    load()
  }, [])

  const handleSave = async () => {
    const isSaved = savedWords.includes(word)

    const result = await toggleSaveStatus(
      { word } as WordInfo,
      isSaved
    )

    if (result.success) {
      setSavedWords((prev) =>
        isSaved
          ? prev.filter((x) => x !== word)
          : [...prev, word]
      )
    }
  }

  /* =========================
     Render
  ========================= */
  return (
    <EntryCard
      headword={word}
      pronunciation={{
        phoneticSpelling:
          dictionary?.results?.[0]?.lexicalEntries?.[0]
            ?.entries?.[0]?.pronunciations?.[0]
            ?.phoneticSpelling,
        audioFile:
          dictionary?.results?.[0]?.lexicalEntries?.[0]
            ?.entries?.[0]?.pronunciations?.[0]
            ?.audioFile,
      }}
      etymology={etymology}
      senses={senses}
      patterns={patterns}
      isBookmarked={savedWords.includes(word)}
      onSave={handleSave}
    />
  )
}