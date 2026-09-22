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
const WORDS_CHUNK = 500      // avg 8 chars * 500 ≈ 4KB URL — 安全
const DICT_CHUNK = 200       // UUID 36 chars * 200 ≈ 7KB URL — 安全

type SsrDeckWordRow = {
  word: string
  position: number
  meaning: string | null
  example: string | null
  example_translation: string | null
  rank: string | null
  pinned_sense_id: string | null
}

const deckWordsUrl = (deckId: string) =>
  `${SUPABASE_URL}/rest/v1/deck_words?select=word,position,meaning,example,example_translation,rank,pinned_sense_id&deck_id=eq.${encodeURIComponent(deckId)}&order=position.asc`

// deck_words + words + dictionary_cache を REST 直叩きで取得（SSR で使う）。
// クライアントの fetchDeckWords と同じ結果を返すが、Next.js Data Cache に載る。
// 2,000 語超のデッキ (英検 1 級 ≈ 2,200 語) にも耐えるように:
//   1) 先頭 range を Prefer: count=exact で叩いて総件数を Content-Range から取得
//   2) 残りの range を Promise.all で並列取得
//   3) words / dictionary_cache の .in() チャンクも Promise.all で並列化
// これで直列 25 回超だった HTTP を先頭 1 + 並列 24 に短縮する。
export const getDeckWordsSSR = cache(async (deckId: string): Promise<DeckWordEntry[]> => {
  try {
    const firstRes = await fetch(deckWordsUrl(deckId), {
      headers: {
        ...SUPABASE_HEADERS,
        Range: `0-${RANGE_CHUNK - 1}`,
        'Range-Unit': 'items',
        Prefer: 'count=exact',
      },
      next: { revalidate: DAY },
    })
    if (!firstRes.ok) return []
    const firstRows = (await firstRes.json()) as SsrDeckWordRow[]
    if (firstRows.length === 0) return []

    // Content-Range: "0-999/2200" のような形式
    const contentRange = firstRes.headers.get('Content-Range') ?? ''
    const total = Number(contentRange.split('/')[1] ?? '') || firstRows.length

    const restRanges: Array<[number, number]> = []
    for (let from = RANGE_CHUNK; from < total; from += RANGE_CHUNK) {
      restRanges.push([from, Math.min(from + RANGE_CHUNK - 1, total - 1)])
    }
    const restRows = (
      await Promise.all(
        restRanges.map(async ([a, b]) => {
          const r = await fetch(deckWordsUrl(deckId), {
            headers: { ...SUPABASE_HEADERS, Range: `${a}-${b}`, 'Range-Unit': 'items' },
            next: { revalidate: DAY },
          })
          if (!r.ok) return [] as SsrDeckWordRow[]
          return (await r.json()) as SsrDeckWordRow[]
        })
      )
    ).flat()
    const deckRows = [...firstRows, ...restRows]

    const words = deckRows.map((r) => r.word)
    const wordChunkPromises: Array<Promise<Array<{ id: string; word: string }>>> = []
    for (let i = 0; i < words.length; i += WORDS_CHUNK) {
      const slice = words.slice(i, i + WORDS_CHUNK)
      const inList = slice.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
      wordChunkPromises.push(
        fetch(
          `${SUPABASE_URL}/rest/v1/words?select=id,word&word=in.(${encodeURIComponent(inList)})`,
          { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
        ).then((r) => (r.ok ? r.json() : []))
      )
    }
    const wordRows = (await Promise.all(wordChunkPromises)).flat() as Array<{ id: string; word: string }>
    const wordIdByWord = new Map<string, string>(wordRows.map((r) => [r.word, r.id]))

    const wordIds = [...wordIdByWord.values()]
    const dictChunkPromises: Array<Promise<Array<{ word_id: string; payload: SavedWordDictionary | null }>>> = []
    for (let i = 0; i < wordIds.length; i += DICT_CHUNK) {
      const slice = wordIds.slice(i, i + DICT_CHUNK)
      const idList = slice.map((id) => `"${id}"`).join(',')
      dictChunkPromises.push(
        fetch(
          `${SUPABASE_URL}/rest/v1/dictionary_cache?select=word_id,payload&word_id=in.(${encodeURIComponent(idList)})`,
          { headers: SUPABASE_HEADERS, next: { revalidate: DAY } }
        ).then((r) => (r.ok ? r.json() : []))
      )
    }
    const cacheRows = (await Promise.all(dictChunkPromises)).flat()
    const cacheByWordId = new Map<string, SavedWordDictionary | null>(
      cacheRows.map((r) => [r.word_id, r.payload ?? null])
    )

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
