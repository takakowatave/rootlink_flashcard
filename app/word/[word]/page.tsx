import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from "next"
import WordPageClient from '@/components/WordPageClient'
import PhrasePageClient from '@/components/PhrasePageClient'
import { getPostsReferencingWord } from '@/lib/blog'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  "https://rootlink-server-v2-774622345521.asia-northeast1.run.app"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// GET を優先する。POST だと Next.js の Data Cache に載らず、
// ページ表示のたびに Cloud Run まで飛んでしまう（revalidate が無視される）。
// GET 未対応のサーバーが動いている間は POST に落とす。
// これによりフロントとサーバーのデプロイ順を問わない。
const resolveWord = cache(async (raw: string) => {
  try {
    const res = await fetch(
      `${API_BASE}/resolve?query=${encodeURIComponent(raw)}`,
      { next: { revalidate: 60 * 60 * 24 } }
    )

    if (res.ok) {
      const data = await res.json()
      return data.ok ? data : null
    }

    // 404 / 405 は「GET 未対応の旧サーバー」を意味する。それ以外は諦める。
    if (res.status !== 404 && res.status !== 405) return null

    const fallback = await fetch(`${API_BASE}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: raw }),
      cache: "no-store",
    })
    if (!fallback.ok) return null
    const data = await fallback.json()
    return data.ok ? data : null
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

type MetaDictionary = {
  senseGroups?: Array<{
    senses?: Array<{ senseId?: string }>
  }>
  locales?: {
    ja?: {
      senses?: Record<string, { meaning?: string }>
    }
  }
}

function getFirstJaMeaning(dictionary: MetaDictionary | null): string | null {
  const jaSenses = dictionary?.locales?.ja?.senses
  if (!jaSenses) return null
  const firstSenseId = dictionary?.senseGroups?.[0]?.senses?.[0]?.senseId
  if (!firstSenseId) return null
  const meaning = jaSenses[firstSenseId]?.meaning?.trim()
  return meaning || null
}

function buildTitle(word: string): string {
  return `${word} の語源と意味｜語根から覚える英単語`
}

function buildDescription(word: string, dictionary: MetaDictionary | null): string {
  const jaMeaning = getFirstJaMeaning(dictionary)
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
  const title = buildTitle(word)
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
    const relatedPosts = await getPostsReferencingWord(resolvedWord)
    return (
      <WordPageClient
        key={resolvedWord}
        word={resolvedWord}
        dictionary={dictionary}
        correctedFrom={correctedFrom}
        initialPinnedSenseId={pin}
        relatedPosts={relatedPosts}
      />
    )
  }

  // 単語がなければ phrase_cards を検索
  const phraseCard = await resolvePhrase(raw)
  if (phraseCard) {
    return <PhrasePageClient card={phraseCard} />
  }

  // 単語でもフレーズでもなければ 404。
  // 200 を返すとクローラーが正常ページとして index し、再訪のたびに
  // Oxford の従量課金が積まれる。
  notFound()
}
