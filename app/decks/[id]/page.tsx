import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { notFound, permanentRedirect } from 'next/navigation'
import DeckClient from './DeckClient'
import { toShortName } from '@/lib/deckDisplay'
import type { SavedWordDictionary } from '@/types/Dictionary'

type DeckRow = {
  id: string
  slug: string | null
  name: string
  label: string
  description: string | null
  is_premium: boolean
  word_count: number
  is_official: boolean
}

type DeckWordEntry = {
  word: string
  meaning: string | null
  dictionary: SavedWordDictionary | null
  pinned_sense_id: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
}
const DAY = 60 * 60 * 24

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const getDeck = cache(async (idOrSlug: string): Promise<DeckRow | null> => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug'
  const { data } = await supabase
    .from('decks')
    .select('id, slug, name, label, description, is_premium, word_count, is_official')
    .eq(column, idOrSlug)
    .maybeSingle()
  return (data as DeckRow | null) ?? null
})

// deck_words + words + dictionary_cache を REST 直叩きで取得（SSR で使う）。
// クライアントの fetchDeckWords と同じ結果を返すが、Next.js Data Cache に載る。
const getDeckWordsSSR = cache(async (deckId: string): Promise<DeckWordEntry[]> => {
  try {
    const deckRes = await fetch(
      `${SUPABASE_URL}/rest/v1/deck_words?select=word,meaning&deck_id=eq.${encodeURIComponent(deckId)}&limit=2000`,
      { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
    )
    if (!deckRes.ok) return []
    const deckRows = (await deckRes.json()) as Array<{ word: string; meaning: string | null }>
    if (deckRows.length === 0) return []

    const words = deckRows.map((r) => r.word)
    const inList = words.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
    const wordsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/words?select=id,word&word=in.(${encodeURIComponent(inList)})&limit=2000`,
      { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
    )
    if (!wordsRes.ok) return deckRows.map((r) => ({ word: r.word, meaning: r.meaning, dictionary: null, pinned_sense_id: null }))
    const wordRows = (await wordsRes.json()) as Array<{ id: string; word: string }>
    const wordIdByWord = new Map(wordRows.map((r) => [r.word, r.id]))
    const wordIds = [...wordIdByWord.values()]

    const cacheByWordId = new Map<string, SavedWordDictionary | null>()
    if (wordIds.length > 0) {
      const idList = wordIds.map((id) => `"${id}"`).join(',')
      const cacheRes = await fetch(
        `${SUPABASE_URL}/rest/v1/dictionary_cache?select=word_id,payload&word_id=in.(${encodeURIComponent(idList)})&limit=2000`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
      )
      if (cacheRes.ok) {
        const cacheRows = (await cacheRes.json()) as Array<{ word_id: string; payload: SavedWordDictionary | null }>
        cacheRows.forEach((r) => cacheByWordId.set(r.word_id, r.payload ?? null))
      }
    }

    return deckRows.map((row) => ({
      word: row.word,
      meaning: row.meaning ?? null,
      dictionary: cacheByWordId.get(wordIdByWord.get(row.word) ?? '') ?? null,
      pinned_sense_id: null,
    }))
  } catch {
    return []
  }
})

function buildTitleHead(label: string, shortName: string): string {
  if (label === 'TOEIC') return shortName === '頻出' ? 'TOEIC 頻出' : `TOEIC ${shortName}点`
  if (label === '英検') return `英検${shortName}`
  return `${label} ${shortName}`
}

function canonicalPath(deck: DeckRow): string {
  return `/decks/${deck.slug ?? deck.id}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const deck = await getDeck(params.id)
  if (!deck) return { title: 'RootLink' }

  const shortName = toShortName(deck.name, deck.label)
  const head = buildTitleHead(deck.label, shortName)
  const title = `${head}の英単語${deck.word_count}語｜語源で覚える`
  const shareTitle = `${title} | RootLink`
  const description =
    deck.description ??
    `${head}レベルの重要英単語${deck.word_count}語を、語源から理解して定着させる単語帳。`

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical: canonicalPath(deck) },
    openGraph: { title: shareTitle, description, type: 'website' },
    twitter: { card: 'summary', title: shareTitle, description },
  }
  if (!deck.is_official) {
    meta.robots = { index: false, follow: true }
  }
  return meta
}

export default async function DeckPage({ params }: { params: { id: string } }) {
  const deck = await getDeck(params.id)
  if (!deck) notFound()

  // 旧 /decks/{uuid} は /decks/{slug} へ 308 リダイレクト
  if (UUID_RE.test(params.id) && deck.slug) {
    permanentRedirect(`/decks/${deck.slug}`)
  }

  const initialEntries = await getDeckWordsSSR(deck.id)

  return (
    <DeckClient
      deck={{
        id: deck.id,
        name: deck.name,
        label: deck.label,
        description: deck.description,
        is_premium: deck.is_premium,
      }}
      initialEntries={initialEntries}
    />
  )
}
