'use client'

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import { supabase } from '@/lib/supabaseClient'
import { normalizeDictionary } from '@/lib/normalizeDictionary'

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

  const grammarTags = dictionary?.grammarTags ?? []
  console.log(dictionary.grammarTags)

  const {
    inflections,
    synonyms,
    antonyms,
    senses,
    patterns,
    etymology,
  } = parsed

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
    patterns={patterns}
    inflections={inflections}
    synonyms={synonyms}
    antonyms={antonyms}
    grammarTags={grammarTags}   // ← これ追加
    isBookmarked={savedWords.includes(word)}
    onSave={handleSave}
  />
  )
}