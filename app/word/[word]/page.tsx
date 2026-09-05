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
      `${SUPABASE_URL}/rest/v1/phrase_cards?phrase=ilike.${encodeURIComponent(raw)}*&meaning_ja=not.is.null&skip_reason=is.null&limit=1`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }, next: { revalidate: 60 * 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.[0] ?? null
  } catch {
    return null
  }
})

type EtymologyPart = {
  text?: string
  meaningJa?: string
  order?: number
}

type MetaDictionary = {
  senseGroups?: Array<{
    senses?: Array<{ senseId?: string }>
  }>
  locales?: {
    ja?: {
      senses?: Record<string, { meaning?: string }>
    }
  }
  etymologyData?: {
    structure?: {
      parts?: EtymologyPart[]
    }
  }
}

function getFirstTwoParts(dictionary: MetaDictionary | null): EtymologyPart[] {
  const parts = dictionary?.etymologyData?.structure?.parts
  if (!parts || parts.length === 0) return []
  return parts
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .filter(p => typeof p.text === 'string' && p.text.length > 0)
    .slice(0, 2)
}

function getFirstJaMeaning(dictionary: MetaDictionary | null): string | null {
  const jaSenses = dictionary?.locales?.ja?.senses
  if (!jaSenses) return null
  const firstSenseId = dictionary?.senseGroups?.[0]?.senses?.[0]?.senseId
  if (!firstSenseId) return null
  const meaning = jaSenses[firstSenseId]?.meaning?.trim()
  return meaning || null
}

function buildTitle(word: string, dictionary: MetaDictionary | null): string {
  const parts = getFirstTwoParts(dictionary)
  if (parts.length >= 2) {
    return `${word} の語源と意味｜${parts.map(p => p.text).join(' + ')} で覚える`
  }
  return `${word} の語源と意味｜語根から覚える英単語`
}

function buildDescription(word: string, dictionary: MetaDictionary | null): string {
  const parts = getFirstTwoParts(dictionary)
  const jaMeaning = getFirstJaMeaning(dictionary)

  if (parts.length >= 2 && parts.every(p => p.meaningJa) && jaMeaning) {
    const partsStr = parts.map(p => `${p.text}（${p.meaningJa}）`).join(' + ')
    return `${word} の語源は ${partsStr}。「${jaMeaning}」という意味の成り立ちを語根から解説します。`
  }

  if (jaMeaning) {
    return `${word} の意味は「${jaMeaning}」。語根と語源から英単語の成り立ちを解説します。`
  }

  return `${word} の語源と意味を語根から解説します。RootLink で英単語を語源から理解しよう。`
}

export async function generateMetadata({ params }: { params: { word: string } }): Promise<Metadata> {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()
  const data = await resolveWord(raw)
  const word = data?.resolved ?? raw
  const dictionary = (data?.dictionary ?? null) as MetaDictionary | null
  const title = buildTitle(word, dictionary)
  const description = buildDescription(word, dictionary)
  const cardUrl = `https://www.rootlink.app/word/${encodeURIComponent(word)}/card.png`
  return {
    title,
    description,
    alternates: {
      canonical: `/word/${encodeURIComponent(word)}`,
    },
    openGraph: {
      title: `${word} | RootLink`,
      description,
      url: `https://www.rootlink.app/word/${encodeURIComponent(word)}`,
      images: [{ url: cardUrl, width: 1200, height: 675, alt: `${word} — RootLink` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${word} | RootLink`,
      description,
      images: [cardUrl],
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { word: string }
  searchParams?: { pin?: string }
}) {
  const raw = decodeURIComponent(params.word).replace(/_/g, ' ').trim().toLowerCase()
  const pin = searchParams?.pin ?? null

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
        initialPinnedSenseId={pin}
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
