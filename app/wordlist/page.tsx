'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import EntryCard from "@/components/EntryCard"
import { fetchWordlists, toggleSaveStatus } from "@/lib/supabaseApi"
import toast, { Toaster } from "react-hot-toast"
import { supabase } from "@/lib/supabaseClient"

export type SavedWordRow = {
  word_id: string
  word: string
  saved_id?: string
  dictionary?: any
}

function buildPronunciation(dictionary: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (dictionary?.audio?.audioPath) {
    return {
      phoneticSpelling: dictionary.ipa ?? undefined,
      audioFile: `${supabaseUrl}/storage/v1/object/public/${dictionary.audio.audioPath}`,
    }
  }
  return {
    phoneticSpelling: dictionary?.ipa ?? undefined,
    audioFile: undefined,
  }
}

function buildSenses(dictionary: any): Record<string, { senseId: string; meaning: string; example?: string; exampleTranslation?: string }[]> {
  const senseGroups: any[] = dictionary?.senseGroups ?? []
  const jaLocales: Record<string, any> = dictionary?.locales?.ja?.senses ?? {}

  const result: Record<string, any[]> = {}

  for (const group of senseGroups) {
    const pos = String(group.partOfSpeech ?? '').toLowerCase()
    if (!pos) continue

    const senses = (group.senses ?? [])
      .map((sense: any) => {
        const senseId = String(sense.senseId ?? '')
        const ja = jaLocales[senseId]
        return {
          senseId,
          meaning: ja?.definitionJa ?? sense.definition ?? '',
          example: sense.example ?? undefined,
          exampleTranslation: ja?.exampleJa ?? undefined,
        }
      })
      .filter((s: any) => s.senseId && s.meaning)

    if (senses.length > 0) result[pos] = senses
  }

  return result
}

export default function WordListPage() {
  const [wordList, setWordList] = useState<SavedWordRow[]>([])
  const [savedWords, setSavedWords] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return
      const words = await fetchWordlists(data.user.id)
      setWordList(words)
      setSavedWords(words.map((w) => w.word))
    }
    load()
  }, [])

  const handleToggleSave = async (word: SavedWordRow) => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { toast.error("ログインが必要です"); return }

    const result = await toggleSaveStatus(word)
    if (!result.success) { toast.error("処理に失敗しました"); return }

    const updated = await fetchWordlists(data.user.id)
    setWordList(updated)
    setSavedWords(updated.map((w) => w.word))
    toast.success("更新しました")
  }

  return (
    <>
      <Toaster position="top-center" />
      {[...wordList].reverse().map((item) => {
        const d = item.dictionary
        const pronunciation = buildPronunciation(d)
        const senses = buildSenses(d)
        const inflections: string[] = d?.inflections ?? []
        const firstSenseId = Object.values(senses)[0]?.[0]?.senseId ?? null

        return (
          <Link key={item.saved_id ?? item.word_id} href={`/word/${item.word}`} className="block">
            <EntryCard
              headword={item.word}
              pronunciation={pronunciation}
              etymology=""
              senses={senses}
              inflections={inflections}
              grammarTags={{}}
              isBookmarked={savedWords.includes(item.word)}
              onSave={(e) => { e?.preventDefault(); e?.stopPropagation(); handleToggleSave(item) }}
              pinnedSenseId={firstSenseId}
              displayLocale="ja"
              compact
            />
          </Link>
        )
      })}
    </>
  )
}
