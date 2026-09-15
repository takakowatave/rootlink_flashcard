import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from "next"
import WordPageClient from '@/components/WordPageClient'
import PhrasePageClient from '@/components/PhrasePageClient'
import { getPostsReferencingWord } from '@/lib/blog'
import type { RewrittenPayload } from '@/types/Dictionary'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * SSR は dictionary_cache だけを読む。Cloud Run も Oxford も呼ばない。
 *
 * この関数に Oxford へ到達する経路が存在しないことが、コスト保護の本体。
 * 未知の語を何万件踏まれても Supabase の空振りで終わる。
 * 認証判定やボット判定に依存しないので、条件が変わっても破れない。
 *
 * 新規語は、ユーザーが検索窓から引いた時点でクライアントの POST /resolve が
 * dictionary_cache に入れるため、その後はここで拾える。
 *
 * 埋め込み結合ではなく素の等価フィルタ2回にしているのは、
 * 挙動が確実で、失敗したときに全単語ページが 404 になる事故を避けるため。
 * どちらのクエリも Data Cache に載るので実コストはほぼゼロ。
 *
 * 2026-09 に AhrefsBot が /word/[存在しない語] を列挙し、SSR 経由で
 * Oxford の従量課金が積まれた。詳細は Notion「インシデント 2026-08 Oxford API」参照。
 */
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
}

const DAY = 60 * 60 * 24

const resolveWord = cache(
  async (raw: string): Promise<{ resolved: string; dictionary: RewrittenPayload } | null> => {
    try {
      const wordRes = await fetch(
        `${SUPABASE_URL}/rest/v1/words?select=id,word&word=eq.${encodeURIComponent(raw)}&limit=1`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
      )
      if (!wordRes.ok) return null

      const wordRows: unknown = await wordRes.json()
      const wordRow = Array.isArray(wordRows) ? wordRows[0] : null
      const wordId = (wordRow as { id?: unknown } | null)?.id
      if (wordId === undefined || wordId === null) return null

      const resolved =
        typeof (wordRow as { word?: unknown }).word === "string"
          ? (wordRow as { word: string }).word
          : raw

      const cacheRes = await fetch(
        `${SUPABASE_URL}/rest/v1/dictionary_cache?select=payload&word_id=eq.${encodeURIComponent(
          String(wordId)
        )}&limit=1`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
      )
      if (!cacheRes.ok) return null

      const cacheRows: unknown = await cacheRes.json()
      const cacheRow = Array.isArray(cacheRows) ? cacheRows[0] : null
      const payload = (cacheRow as { payload?: unknown } | null)?.payload
      if (!payload) return null

      return { resolved, dictionary: payload as RewrittenPayload }
    } catch {
      return null
    }
  }
)

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
    const relatedPosts = await getPostsReferencingWord(resolvedWord)
    return (
      <WordPageClient
        key={resolvedWord}
        word={resolvedWord}
        dictionary={data.dictionary}
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

  // キャッシュに無い語は 404。ここで Oxford を叩きに行かない。
  // 200 を返すとクローラーが正常ページとして index し、再訪し続ける。
  notFound()
}
