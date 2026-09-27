import { cache } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from "next"
import WordPageClient from '@/components/WordPageClient'
import PhrasePageClient from '@/components/PhrasePageClient'
import { getPostsReferencingWord } from '@/lib/blog'
import { toShortName, sortDecksByDifficulty, getDeckImage } from '@/lib/deckDisplay'
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

/**
 * 検索フローで来たときは fresh=1 が付く。その場合 Data Cache を bypass して
 * (cache: 'no-store') 直前の /resolve で書き込まれた DB 内容を必ず読み込む。
 * 以前は revalidate: DAY のせいで、他ユーザ/bot が同じ URL で先に空応答を
 * cache してしまうと直後の検索が 404 に化けていた (Bug: 検索結果前に 404 flash)。
 * bot / 直接アクセスは fresh 無しで従来通り DAY cache を使う (Oxford コスト保護維持)。
 */
const resolveWord = cache(
  async (raw: string, fresh = false): Promise<{ resolved: string; dictionary: RewrittenPayload } | null> => {
    const cacheOpts = fresh
      ? ({ cache: 'no-store' } as const)
      : ({ next: { revalidate: DAY } } as const)
    try {
      const wordRes = await fetch(
        `${SUPABASE_URL}/rest/v1/words?select=id,word&word=eq.${encodeURIComponent(raw)}&limit=1`,
        { headers: SUPABASE_HEADERS, ...cacheOpts }
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
        { headers: SUPABASE_HEADERS, ...cacheOpts }
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

const filterExistingWords = cache(async (candidates: string[]): Promise<string[]> => {
  const unique = [...new Set(candidates.map((c) => c.toLowerCase()).filter(Boolean))]
  if (unique.length === 0) return []
  try {
    const inList = unique.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/words?select=word&word=in.(${encodeURIComponent(inList)})&limit=2000`,
      { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Array<{ word: string }>
    const found = new Set(rows.map((r) => r.word.toLowerCase()))
    return candidates.filter((d) => found.has(d.toLowerCase()))
  } catch {
    return []
  }
})

/**
 * その単語が収録されている公式デッキ (is_official=true) を返す。
 * Notion issue 3d2d9703-…-7fcfc の「単語ページに試験レベルバッジとデッキ導線を追加」用。
 * SSR で 1 回叩けば済むよう PostgREST の embed で 1 リクエストにまとめる。
 * 該当なしなら空配列。全単語ページから公式デッキへの内部リンクが集まる。
 */
export type WordDeckCard = {
  slug: string
  label: string
  shortName: string
  wordCount: number
  imageSrc?: string
  isPremium: boolean
}

// 内部シェイプ: sortDecksByDifficulty が name / label / is_premium を要求するので合わせる。
type SortableRow = {
  slug: string
  name: string
  label: string
  shortName: string
  wordCount: number
  imageSrc?: string
  is_premium: boolean
}

const getDecksContainingWord = cache(async (word: string): Promise<WordDeckCard[]> => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/deck_words?select=decks(id,slug,name,label,is_official,is_premium,word_count)&word=eq.${encodeURIComponent(word)}&limit=200`,
      { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
    )
    if (!res.ok) return []
    type Row = { decks: { id: string; slug: string | null; name: string; label: string; is_official: boolean; is_premium: boolean; word_count: number | null } | null }
    const rows = (await res.json()) as Row[]
    const seen = new Set<string>()
    const sortable: SortableRow[] = []
    for (const r of rows) {
      const d = r.decks
      if (!d || !d.is_official) continue
      const slug = d.slug ?? d.id
      if (seen.has(slug)) continue
      seen.add(slug)
      const shortName = toShortName(d.name, d.label)
      sortable.push({
        slug,
        name: d.name,
        label: d.label,
        shortName,
        wordCount: d.word_count ?? 0,
        imageSrc: getDeckImage(d.label, shortName),
        is_premium: !!d.is_premium,
      })
    }
    return sortDecksByDifficulty(sortable).map((r) => ({
      slug: r.slug,
      label: r.label,
      shortName: r.shortName,
      wordCount: r.wordCount,
      imageSrc: r.imageSrc,
      isPremium: r.is_premium,
    }))
  } catch {
    return []
  }
})

function readDerivativesFromDictionary(dictionary: RewrittenPayload | null): string[] {
  const raw = (dictionary as unknown as { derivatives?: unknown } | null)?.derivatives
  if (!Array.isArray(raw)) return []
  return raw.filter((v): v is string => typeof v === 'string' && v.length > 0)
}

// 完全一致 (ilike, case-insensitive) で引く。以前は末尾に `*` を付けていたため
// `/word/meet` のフォールバックが `meet up with someone` を prefix match で拾って
// 単語検索が熟語ページに化ける事故が起きていた (2026-09-20 kiko 指摘)。
const resolvePhrase = cache(async (raw: string) => {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/phrase_cards?phrase=ilike.${encodeURIComponent(raw)}&meaning_ja=not.is.null&skip_reason=is.null&limit=1`,
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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { word: string }
  searchParams?: { fresh?: string }
}): Promise<Metadata> {
  const raw = decodeURIComponent(params.word).trim().toLowerCase()
  const fresh = searchParams?.fresh === '1'
  const data = await resolveWord(raw, fresh)
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
  searchParams?: { pin?: string; fresh?: string }
}) {
  const raw = decodeURIComponent(params.word).replace(/_/g, ' ').trim().toLowerCase()
  const pin = searchParams?.pin ?? null
  const fresh = searchParams?.fresh === '1'

  // 複数語はフレーズを優先して検索（語源ツリーを避ける）
  if (raw.includes(' ')) {
    const phraseCard = await resolvePhrase(raw)
    if (phraseCard) {
      return <PhrasePageClient card={phraseCard} />
    }
  }

  const data = await resolveWord(raw, fresh)
  if (data) {
    const resolvedWord = data.resolved
    const rawDerivatives = readDerivativesFromDictionary(data.dictionary)
    const [relatedPosts, initialExistingDerivatives, containingDecks] = await Promise.all([
      getPostsReferencingWord(resolvedWord),
      filterExistingWords(rawDerivatives),
      getDecksContainingWord(resolvedWord),
    ])
    return (
      <WordPageClient
        key={resolvedWord}
        word={resolvedWord}
        dictionary={data.dictionary}
        initialPinnedSenseId={pin}
        relatedPosts={relatedPosts}
        initialExistingDerivatives={initialExistingDerivatives}
        containingDecks={containingDecks}
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
