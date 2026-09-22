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

// 内部 helper: 指定 word[] の dictionary_cache を並列取得して word→payload を返す。
async function fetchDictionariesFor(
  words: string[],
  tags: string[],
): Promise<Map<string, SavedWordDictionary | null>> {
  const wordChunkPromises: Array<Promise<Array<{ id: string; word: string }>>> = []
  for (let i = 0; i < words.length; i += WORDS_CHUNK) {
    const slice = words.slice(i, i + WORDS_CHUNK)
    const inList = slice.map((w) => `"${w.replace(/"/g, '')}"`).join(',')
    wordChunkPromises.push(
      fetch(
        `${SUPABASE_URL}/rest/v1/words?select=id,word&word=in.(${encodeURIComponent(inList)})`,
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY, tags } }
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
        { headers: SUPABASE_HEADERS, next: { revalidate: DAY, tags } }
      ).then((r) => (r.ok ? r.json() : []))
    )
  }
  const cacheRows = (await Promise.all(dictChunkPromises)).flat()
  const cacheByWordId = new Map<string, SavedWordDictionary | null>(
    cacheRows.map((r) => [r.word_id, r.payload ?? null])
  )
  const byWord = new Map<string, SavedWordDictionary | null>()
  for (const [word, wordId] of wordIdByWord.entries()) {
    byWord.set(word, cacheByWordId.get(wordId) ?? null)
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

// 内部 helper: そのデッキの deck_words 総数だけを取る (Content-Range 経由)。
// 章画面のロック判定 (totalChapters) にしか使わないので row body は捨てる。
async function fetchDeckWordCount(deckId: string): Promise<number> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/deck_words?deck_id=eq.${encodeURIComponent(deckId)}&select=word`,
    {
      headers: {
        ...SUPABASE_HEADERS,
        Range: '0-0',
        'Range-Unit': 'items',
        Prefer: 'count=exact',
      },
      next: { revalidate: DAY, tags: [deckMetaTag(deckId), 'deck-words'] },
    }
  )
  if (!res.ok) return 0
  // 消費しないと keep-alive に悪影響なので読み捨てる
  try { await res.text() } catch { /* ignore */ }
  const cr = res.headers.get('Content-Range') ?? ''
  return Number(cr.split('/')[1] ?? '') || 0
}

// 内部 helper: 指定 chapter の 50 語ぶんだけ deck_words を position 範囲で取る。
async function fetchChapterWordRows(deckId: string, chapterNo: number): Promise<SsrDeckWordRow[]> {
  const from = (chapterNo - 1) * CHAPTER_SIZE
  const to = from + CHAPTER_SIZE - 1
  const url =
    `${SUPABASE_URL}/rest/v1/deck_words` +
    `?select=word,position,meaning,example,example_translation,rank,pinned_sense_id` +
    `&deck_id=eq.${encodeURIComponent(deckId)}` +
    `&position=gte.${from}&position=lte.${to}` +
    `&order=position.asc`
  const res = await fetch(url, {
    headers: SUPABASE_HEADERS,
    next: { revalidate: DAY, tags: [deckMetaTag(deckId), 'deck-words'] },
  })
  if (!res.ok) return []
  return (await res.json()) as SsrDeckWordRow[]
}

/**
 * 章画面用。以下 3 本を並列で叩く:
 *   1) その章の 50 語ぶんの deck_words (position 範囲で filter)
 *   2) デッキ全体の総語数 (Content-Range のヘッダのみ拾って body は捨てる) —
 *      totalChapters を出してロック判定と章数表示に使うため
 *   3) → 1) が返ったあと、その 50 語ぶんの words + dictionary_cache
 * 直列 3 段だった前バージョンから 2 段に短縮している。
 */
export const getChapterEntriesSSR = cache(
  async (
    deckId: string,
    chapterNo: number,
  ): Promise<{ chapterEntries: DeckWordEntry[]; totalWords: number }> => {
    try {
      const [totalWords, chapterRows] = await Promise.all([
        fetchDeckWordCount(deckId),
        fetchChapterWordRows(deckId, chapterNo),
      ])
      if (chapterRows.length === 0) return { chapterEntries: [], totalWords }

      const chapterWords = chapterRows.map((r) => r.word)
      const dictByWord = await fetchDictionariesFor(chapterWords, [
        deckMetaTag(deckId),
        chapterDictTag(deckId, chapterNo),
        'deck-dictionaries',
      ])
      const chapterEntries = chapterRows.map((row) => {
        const raw = dictByWord.get(row.word) ?? null
        const dictionary = applyDeckOverridesToDictionary(raw, {
          pinnedSenseId: row.pinned_sense_id ?? null,
          meaning: row.meaning ?? null,
          example: row.example ?? null,
          exampleTranslation: row.example_translation ?? null,
        })
        return { ...rowToLightEntry(row), dictionary }
      })
      return { chapterEntries, totalWords }
    } catch {
      return { chapterEntries: [], totalWords: 0 }
    }
  }
)
