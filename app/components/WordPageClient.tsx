'use client'

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import { supabase } from '@/lib/supabaseClient'
import { normalizeDictionary } from '@/lib/normalizeDictionary'
import type { LexicalUnit } from "@/types/LexicalUnit"

export default function WordPageClient({
  word,
  dictionary,
}: {
  word: string
  dictionary: any
}) {


  /* =========================
     Oxford JSON 正規化
  ========================= */

  const parsed = useMemo(() => {
    return normalizeDictionary(dictionary, word)
  }, [dictionary, word])
  console.log("parsed", parsed)

  const {
    inflections,
    synonyms,
    antonyms,
    derivatives,
    senses,
    lexicalUnits,
    etymology,
  } = parsed

  console.log(
    JSON.stringify(
      dictionary?.results?.[0]?.lexicalEntries?.[0]?.entries?.[0],
      null,
      2
    )
  )
  const grammarTags = useMemo(() => {

    const result: Record<string, string[]> = {}
  
    const lexicalEntries =
      dictionary?.results?.flatMap((r: any) => r.lexicalEntries ?? []) ?? []
  
    lexicalEntries.forEach((le: any) => {
  
      const pos = le.lexicalCategory?.id
  
      const features: string[] =
      (le.entries ?? [])
        .flatMap((e: any) => [
          ...(e.notes ?? []),
    
          ...(e.senses ?? []).flatMap((s: any) => [
            ...(s.notes ?? []),
            ...(s.subsenses ?? []).flatMap((ss: any) => ss.notes ?? [])
          ])
        ])
        .filter((n: any) => n.type === "grammaticalNote")
        .map((n: any) => n.text)
  
      if (!features.length) return
  
      result[pos] = [...new Set(features)]
  
    })
  
    return result
  
  }, [dictionary])
  /* =========================
     保存状態
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

  /* =========================
     保存処理
  ========================= */

  const handleSave = async () => {

    const result = await toggleSaveStatus({
      word,
      dictionary,
    } as any)

    if (!result.success) return

    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    const list = await fetchWordlists(data.user.id)
    setSavedWords(list.map((w) => w.word))
  }

  /* =========================
     pronunciation
  ========================= */

  const pronunciation = useMemo(() => {

    const lexicalEntries =
      dictionary?.results?.flatMap((r: any) => r.lexicalEntries ?? []) ?? []

    const p =
      lexicalEntries
        ?.flatMap((le: any) => le.entries ?? [])
        ?.flatMap((e: any) => e.pronunciations ?? [])
        ?.find((p: any) => p.audioFile)

    return {
      phoneticSpelling: p?.phoneticSpelling,
      audioFile: p?.audioFile,
    }

  }, [dictionary])

  /* =========================
     Render
  ========================= */

  return (
<EntryCard
  headword={word}
  pronunciation={pronunciation}
  etymology={etymology}
  senses={senses}
  lexicalUnits={lexicalUnits}
  inflections={inflections}
  synonyms={synonyms}
  derivatives={derivatives}
  antonyms={antonyms}
  grammarTags={grammarTags}
  isBookmarked={savedWords.includes(word)}
  onSave={handleSave}
/>
  )
}