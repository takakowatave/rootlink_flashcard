import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SavedWordDictionary } from '@/types/Dictionary'
import { applyDeckOverridesToDictionary } from '@/lib/dictionaryRender'
import type { DeckWordEntry } from '@/lib/supabaseApi'

export type DeckRow = {
  id: string
  slug: string | null
  name: string
  label: string
  description: string | null
  is_premium: boolean
  word_count: number
  is_official: boolean
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
}
const DAY = 60 * 60 * 24

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const getDeck = cache(async (idOrSlug: string): Promise<DeckRow | null> => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug'
  const { data } = await supabase
    .from('decks')
    .select('id, slug, name, label, description, is_premium, word_count, is_official')
    .eq(column, idOrSlug)
    .maybeSingle()
  return (data as DeckRow | null) ?? null
})

const RANGE_CHUNK = 1000
const IN_CHUNK = 200

type SsrDeckWordRow = {
  word: string
  position: number
  meaning: string | null
  example: string | null
  example_translation: string | null
  rank: string | null
  pinned_sense_id: string | null
}

// deck_words + words + dictionary_cache を REST 直叩きで取得（SSR で使う）。
// クライアントの fetchDeckWords と同じ結果を返すが、Next.js Data Cache に載る。
// 2,000 語超のデッキにも対応するため deck_words は Range ヘッダで range 分割、
// words / dictionary_cache は URL 長対策で .in() を 200 件ずつに分割する。
export const getDeckWordsSSR = cache(async (deckId: string): Promise<DeckWordEntry[]> => {
  try {
    const deckRows: SsrDeckWordRow[] = []
    let from = 0
    while (true) {
      const to = from + RANGE_CHUNK - 1
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/deck_words?select=word,position,meaning,example,example_translation,rank,pinned_sense_id&deck_id=eq.${encodeURIComponent(deckId)}&order=position.asc`,
        {
          headers: { ...SUPABASE_HEADERS, Range: `${from}-${to}`, 'Range-Unit': 'items' },
          next: { revalidate: DAY },
        }
      )
      if (!res.ok) break
      const rows = (await res.json()) as SsrDeckWordRow[]
      if (rows.length === 0) break
      deckRows.push(...rows)
      if (rows.length < RANGE_CHUNK) break
      from += RANGE_CHUNK
    }
    if (deckRows.length === 0) return []

    const words = deckRows.map((r) => r.word)
    const wordIdByWord = new Map<string, string>()
    for (let i = 0; i < words.length; i += IN_CHUNK) {
      const slice = words.slice(i, i + IN_CHUNK)
      const inList = slice.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/words?select=id,word&word=in.(${encodeURIComponent(inList)})`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
      )
      if (!res.ok) continue
      const rows = (await res.json()) as Array<{ id: string; word: string }>
      rows.forEach((r) => wordIdByWord.set(r.word, r.id))
    }

    const wordIds = [...wordIdByWord.values()]
    const cacheByWordId = new Map<string, SavedWordDictionary | null>()
    for (let i = 0; i < wordIds.length; i += IN_CHUNK) {
      const slice = wordIds.slice(i, i + IN_CHUNK)
      const idList = slice.map((id) => `"${id}"`).join(',')
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/dictionary_cache?select=word_id,payload&word_id=in.(${encodeURIComponent(idList)})`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
      )
      if (!res.ok) continue
      const rows = (await res.json()) as Array<{ word_id: string; payload: SavedWordDictionary | null }>
      rows.forEach((r) => cacheByWordId.set(r.word_id, r.payload ?? null))
    }

    return deckRows.map((row) => {
      const raw = cacheByWordId.get(wordIdByWord.get(row.word) ?? '') ?? null
      const dictionary = applyDeckOverridesToDictionary(raw, {
        pinnedSenseId: row.pinned_sense_id ?? null,
        meaning: row.meaning ?? null,
        example: row.example ?? null,
        exampleTranslation: row.example_translation ?? null,
      })
      return {
        word: row.word,
        position: row.position,
        meaning: row.meaning ?? null,
        example: row.example ?? null,
        example_translation: row.example_translation ?? null,
        rank: row.rank ?? null,
        pinned_sense_id: row.pinned_sense_id ?? null,
        dictionary,
      }
    })
  } catch {
    return []
  }
})
