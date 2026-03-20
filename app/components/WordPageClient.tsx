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
     Oxford JSON / rewritten payload 正規化
  ========================= */

  const parsed = useMemo(() => {
    const isRewrittenPayload =
      dictionary &&
      typeof dictionary === 'object' &&
      Array.isArray(dictionary.senseGroups)

    if (!isRewrittenPayload) {
      return normalizeDictionary(dictionary, word)
    }

    const senses: Record<
    string,
    {
      senseId: string
      meaning: string
      example?: string
      patterns?: string[]
    }[]
  > = {}
  
  ;(dictionary.senseGroups ?? []).forEach((group: any) => {
    const pos = String(group?.partOfSpeech ?? '').toLowerCase()
    if (!pos) return
  
    const items: {
      senseId: string
      meaning: string
      example?: string
      patterns?: string[]
    }[] =
        (group?.senses ?? []).map((sense: {
          senseId: string
          definition: string
          example?: string
          patterns?: string[]
        }) => ({
        // backend で付与した senseId をそのまま使う
        senseId: String(sense?.senseId ?? ''),
        meaning: String(sense?.definition ?? ''),
        example: sense?.example ?? undefined,
        patterns: Array.isArray(sense?.patterns) ? sense.patterns : [],
      })) ?? []
  
    const validItems = items.filter(
      (sense) => Boolean(sense.senseId && sense.meaning)
    )
  
    if (validItems.length === 0) return
  
    senses[pos] = validItems
  })

    return {
      inflections: dictionary?.inflections ?? [],
      synonyms: dictionary?.synonyms ?? [],
      antonyms: dictionary?.antonyms ?? [],
      derivatives: dictionary?.derivatives ?? [],
      senses,
      lexicalUnits: dictionary?.lexicalUnits ?? [],
      etymology: dictionary?.etymology ?? '',
    }
  }, [dictionary, word])

  console.log('parsed', parsed)

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
    const lexicalEntries =
      dictionary?.results?.flatMap((r: any) => r.lexicalEntries ?? []) ?? []

    if (lexicalEntries.length === 0) {
      return {}
    }

    const result: Record<string, string[]> = {}

    lexicalEntries.forEach((le: any) => {
      const pos = le.lexicalCategory?.id

      const features: string[] =
        (le.entries ?? [])
          .flatMap((e: any) => [
            ...(e.notes ?? []),
            ...(e.senses ?? []).flatMap((s: any) => [
              ...(s.notes ?? []),
              ...(s.subsenses ?? []).flatMap((ss: any) => ss.notes ?? []),
            ]),
          ])
          .filter((n: any) => n.type === 'grammaticalNote')
          .map((n: any) => n.text)

      if (!pos || !features.length) return

      result[pos] = [...new Set(features)]
    })

    return result
  }, [dictionary])

  /* =========================
     保存状態
  ========================= */

  const [savedWords, setSavedWords] = useState<string[]>([])


  /* pin機能の保存状態 */
  const firstSenseId = useMemo(() => {
    const firstGroup = Object.values(senses)[0] ?? []
    return firstGroup[0]?.senseId ?? null
  }, [senses])

  const [pinnedSenseId, setPinnedSenseId] = useState<string | null>(null)

  useEffect(() => {
    setPinnedSenseId(firstSenseId)
  }, [word, firstSenseId])

  const handleTogglePin = (senseId: string) => {
    if (senseId === pinnedSenseId) return
    setPinnedSenseId(senseId)
  }

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
    if (dictionary?.ipa) {
      return {
        phoneticSpelling: dictionary.ipa,
        audioFile: undefined,
      }
    }

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
      pinnedSenseId={pinnedSenseId}
      onTogglePin={handleTogglePin}
    />
  )
}