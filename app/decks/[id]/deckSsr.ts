import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { SavedWordDictionary } from '@/types/Dictionary'
import { applyDeckOverridesToDictionary } from '@/lib/dictionaryRender'
import type { DeckWordEntry } from '@/lib/supabaseApi'
import { CHAPTER_SIZE } from '@/lib/chapters'

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

// キャッシュタグ:
//   - `deck-list`             : /decks 一覧
//   - `deck-${deckId}`        : そのデッキの meta (word/position/rank/例文) と辞書
//   - `deck-${deckId}-ch-${n}`: そのデッキのある章の辞書だけ
// deck_words を書き換えたら revalidateTag(`deck-${deckId}`) を叩けば
// デッキ画面と章画面が両方フレッシュになる。/api/revalidate/deck 経由。
export const deckMetaTag = (deckId: string) => `deck-${deckId}`
export const chapterDictTag = (deckId: string, chapterNo: number) =>
  `deck-${deckId}-ch-${chapterNo}`

const RANGE_CHUNK = 1000
const WORDS_CHUNK = 500      // avg 8 chars * 500 ≈ 4KB URL — 安全

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

// 内部 helper: deck_words 全件を position 順で取得 (辞書は含まない)。
// 先頭 range を Prefer: count=exact で叩いて総件数を Content-Range から得て、
// 残り range を Promise.all で並列取得する。
async function fetchDeckWordRows(deckId: string): Promise<SsrDeckWordRow[]> {
  const tags = [deckMetaTag(deckId), 'deck-words']
  const firstRes = await fetch(deckWordsUrl(deckId), {
    headers: {
      ...SUPABASE_HEADERS,
      Range: `0-${RANGE_CHUNK - 1}`,
      'Range-Unit': 'items',
      Prefer: 'count=exact',
    },
    next: { revalidate: DAY, tags },
  })
  if (!firstRes.ok) return []
  const firstRows = (await firstRes.json()) as SsrDeckWordRow[]
  if (firstRows.length === 0) return []
  // Content-Range: "0-999/2200"
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
          next: { revalidate: DAY, tags },
        })
        if (!r.ok) return [] as SsrDeckWordRow[]
        return (await r.json()) as SsrDeckWordRow[]
      })
    )
  ).flat()
  return [...firstRows, ...restRows]
}

function rowToLightEntry(row: SsrDeckWordRow): DeckWordEntry {
  return {
    word: row.word,
    position: row.position,
    meaning: row.meaning ?? null,
    example: row.example ?? null,
    example_translation: row.example_translation ?? null,
    rank: row.rank ?? null,
    pinned_sense_id: row.pinned_sense_id ?? null,
    dictionary: null,
  }
}

type WordsWithDict = {
  word: string
  dictionary_cache: { payload: SavedWordDictionary | null } | Array<{ payload: SavedWordDictionary | null }> | null
}

// 内部 helper: 指定 word[] の dictionary_cache を「words を経由した embed」で
// 1 リクエストにまとめて取り、word → payload の Map を返す。
// PostgREST が words.id ↔ dictionary_cache.word_id の FK を認識するので
// words と dictionary_cache を別々に叩く必要がない (以前は 2 段直列だった)。
async function fetchDictionariesFor(
  words: string[],
  tags: string[],
): Promise<Map<string, SavedWordDictionary | null>> {
  if (words.length === 0) return new Map()
  const chunkPromises: Array<Promise<WordsWithDict[]>> = []
  for (let i = 0; i < words.length; i += WORDS_CHUNK) {
    const slice = words.slice(i, i + WORDS_CHUNK)
    const inList = slice.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
    chunkPromises.push(
      fetch(
        `${SUPABASE_URL}/rest/v1/words?select=word,dictionary_cache(payload)&word=in.(${encodeURIComponent(inList)})`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY, tags } }
      ).then((r) => (r.ok ? r.json() : []))
    )
  }
  const rows = (await Promise.all(chunkPromises)).flat()
  const byWord = new Map<string, SavedWordDictionary | null>()
  for (const r of rows) {
    let payload: SavedWordDictionary | null = null
    if (Array.isArray(r.dictionary_cache)) {
      payload = r.dictionary_cache[0]?.payload ?? null
    } else if (r.dictionary_cache) {
      payload = r.dictionary_cache.payload ?? null
    }
    byWord.set(r.word, payload)
  }
  return byWord
}

/**
 * デッキ画面用 (dictionary_cache を読まない軽量版)。
 * word/position/rank/例文差し替え項目だけの deck_words 行を返し、
 * dictionary は常に null。scope カウント・章一覧・「前回の続き」計算に十分。
 * SSR HTML から dictionary payload (per-word 数 KB) が抜けるため、
 * 2,200 語のデッキで HTML サイズが劇的に縮む。
 */
export const getDeckWordsMetaSSR = cache(async (deckId: string): Promise<DeckWordEntry[]> => {
  try {
    const rows = await fetchDeckWordRows(deckId)
    return rows.map(rowToLightEntry)
  } catch {
    return []
  }
})

/**
 * 章画面用。以下を並列で:
 *   1) デッキ全体の deck_words meta (章一覧・totalChapters・ロック判定に必要)
 *   2) 該当 chapter の 50 語ぶんだけ words + dictionary_cache
 * meta と dict の直列を並列に畳んで、SSR 直列段数を 2 → 1 まで縮めている。
 * 章画面でも他章に飛べる導線を出す設計 (Figma 2961:7396) なので全 meta が必要。
 */
export const getChapterEntriesSSR = cache(
  async (
    deckId: string,
    chapterNo: number,
  ): Promise<{ chapterEntries: DeckWordEntry[]; totalWords: number }> => {
    try {
      const from = (chapterNo - 1) * CHAPTER_SIZE
      const to = from + CHAPTER_SIZE - 1

      const [allRows, chapterDict] = await Promise.all([
        fetchDeckWordRows(deckId),
        // 該当章の word[] は allRows を待たずに、position 範囲を DB 側で filter → words 経由で dict 取得
        (async () => {
          const url =
            `${SUPABASE_URL}/rest/v1/deck_words` +
            `?select=word` +
            `&deck_id=eq.${encodeURIComponent(deckId)}` +
            `&position=gte.${from}&position=lte.${to}`
          const res = await fetch(url, {
            headers: SUPABASE_HEADERS,
            next: { revalidate: DAY, tags: [deckMetaTag(deckId), 'deck-words'] },
          })
          if (!res.ok) return new Map<string, SavedWordDictionary | null>()
          const rows = (await res.json()) as Array<{ word: string }>
          const words = rows.map((r) => r.word)
          return fetchDictionariesFor(words, [
            deckMetaTag(deckId),
            chapterDictTag(deckId, chapterNo),
            'deck-dictionaries',
          ])
        })(),
      ])
      if (allRows.length === 0) return { chapterEntries: [], totalWords: 0 }

      const chapterEntries: DeckWordEntry[] = allRows.map((row) => {
        const light = rowToLightEntry(row)
        if (row.position < from || row.position > to) return light
        const raw = chapterDict.get(row.word) ?? null
        const dictionary = applyDeckOverridesToDictionary(raw, {
          pinnedSenseId: row.pinned_sense_id ?? null,
          meaning: row.meaning ?? null,
          example: row.example ?? null,
          exampleTranslation: row.example_translation ?? null,
        })
        return { ...light, dictionary }
      })
      return { chapterEntries, totalWords: allRows.length }
    } catch {
      return { chapterEntries: [], totalWords: 0 }
    }
  }
)
