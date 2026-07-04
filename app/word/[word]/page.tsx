import { cache } from 'react'
import type { Metadata } from "next"
import WordPageClient from '@/components/WordPageClient'
import PhrasePageClient from '@/components/PhrasePageClient'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const resolveWord = cache(async (raw: string) => {
  try {
    const res = await fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: raw }),
      next: { revalidate: 60 * 60 * 24 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.ok) return null
    return data
  } catch {
    return null
  }
})

const resolvePhrase = cache(async (raw: string) => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/phrase_cards?phrase=ilike.${encodeURIComponent(raw)}*&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, next: { revalidate: 60 * 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] ?? null
  } catch {
    return null
  }
})

function extractDescription(dictionary: Record<string, unknown> | null, word: string): string {
  if (!dictionary) return `Explore the etymology and meaning of "${word}" on RootLink.`
  const senses = (dictionary as { senses?: { definition?: string }[] }).senses
  if (senses?.[0]?.definition) {
    const def = senses[0].definition.slice(0, 155)
    return `${word}: ${def}${def.length >= 155 ? "…" : ""}`
  }
  const entries = (dictionary as { entries?: { senses?: { definitions?: string[] }[] }[] }).entries
  const def = entries?.[0]?.senses?.[0]?.definitions?.[0]
  if (def) {
    const trimmed = def.slice(0, 155)
    return `${word}: ${trimmed}${trimmed.length >= 155 ? "…" : ""}`
  }
  return `Explore the etymology and meaning of "${word}" on RootLink.`
}

export async function generateMetadata({ params }: { params: { word: string } }): Promise<Metadata> {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()
  const data = await resolveWord(raw)
  const word = data?.resolved ?? raw
  const description = extractDescription(data?.dictionary ?? data?.raw ?? null, word)
  return {
    title: word,
    description,
    openGraph: { title: `${word} | RootLink`, description, url: `https://www.rootlink.app/word/${encodeURIComponent(word)}` },
    twitter: { card: "summary", title: `${word} | RootLink`, description },
  }
}

export default async function Page({ params }: { params: { word: string } }) {
  const raw = decodeURIComponent(params.word).replace(/_/g, ' ').trim().toLowerCase()

  // 複数語はフレーズを優先して検索（語源ツリーを避ける）
  if (raw.includes(' ')) {
    const phraseCard = await resolvePhrase(raw)
    if (phraseCard) {
      return <PhrasePageClient card={phraseCard} />
    }
  }

  const data = await resolveWord(raw)
  if (data) {
    const resolvedWord = data.resolved
    const dictionary = data.dictionary ?? data.raw ?? null
    const correctedFrom = typeof data.correctedFrom === "string" ? data.correctedFrom : undefined
    return (
      <WordPageClient
        key={resolvedWord}
        word={resolvedWord}
        dictionary={dictionary}
        correctedFrom={correctedFrom}
      />
    )
  }

  // 単語がなければ phrase_cards を検索
  const phraseCard = await resolvePhrase(raw)
  if (phraseCard) {
    return <PhrasePageClient card={phraseCard} />
  }

  // どちらでもなければ WordPageClient に委譲（not found 表示）
  return <WordPageClient key={raw} word={raw} dictionary={null} />
}
