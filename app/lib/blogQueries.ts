import { supabase } from '@/lib/supabaseClient'
import { extractPhraseCardIds, extractWordCardWords, type Post } from '@/lib/blog'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import type { SavedWordDictionary } from '@/types/Dictionary'

export type PostLink = { slug: string; title: string }
export type PostCard = {
  slug: string
  title: string
  tags: string[] | null
  published_at: string | null
  hero_image_url?: string | null
}

// 本文に埋め込まれた phrase-card / word-card をまとめて取得する。
// 記事ページとプレビューページで同じ処理を使う。
export async function fetchPostEmbeds(content: string): Promise<{
  phraseMap: Record<string, EmbeddedPhrase>
  wordCardMap: Record<string, SavedWordDictionary | null>
}> {
  const phraseIds = extractPhraseCardIds(content)
  const wordCardWords = extractWordCardWords(content)

  const [phraseRes, wordRes] = await Promise.all([
    phraseIds.length > 0
      ? supabase
          .from('phrase_cards')
          .select('id, phrase, meaning_ja, meaning_en, example_en, example_ja, type, register, locale, senses')
          .in('id', phraseIds)
          .limit(phraseIds.length)
      : Promise.resolve({ data: null }),
    wordCardWords.length > 0
      ? supabase
          .from('words')
          .select('word, dictionary_cache!inner(payload)')
          .in('word', wordCardWords)
          .limit(wordCardWords.length)
      : Promise.resolve({ data: null }),
  ])

  const phraseMap = phraseRes.data
    ? Object.fromEntries((phraseRes.data as EmbeddedPhrase[]).map((p) => [p.id, p]))
    : {}

  const wordCardMap = wordRes.data
    ? Object.fromEntries(
        (wordRes.data as Array<{
          word: string
          dictionary_cache: { payload: SavedWordDictionary | null } | { payload: SavedWordDictionary | null }[] | null
        }>).map((row) => {
          const cache = Array.isArray(row.dictionary_cache) ? row.dictionary_cache[0] : row.dictionary_cache
          return [row.word, (cache?.payload ?? null) as SavedWordDictionary | null]
        })
      )
    : {}

  return { phraseMap, wordCardMap }
}

// 公開日を基準にした前後の記事。下書きのプレビューでも日付を渡せば前後が出る。
export async function fetchAdjacentPosts(date: string): Promise<{ prev: PostLink | null; next: PostLink | null }> {
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, title')
      .not('published_at', 'is', null)
      .lt('published_at', date)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('slug, title')
      .not('published_at', 'is', null)
      .gt('published_at', date)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])
  return { prev: (prev as PostLink | null) ?? null, next: (next as PostLink | null) ?? null }
}

export type TagCount = { tag: string; count: number }

// 公開記事のタグを数えて多い順に返す。サイドカラムのカテゴリー欄で使う。
export async function fetchTagCounts(): Promise<TagCount[]> {
  const { data } = await supabase
    .from('posts')
    .select('tags')
    .not('published_at', 'is', null)
    .limit(5000)

  const counts = new Map<string, number>()
  ;((data as { tags: string[] | null }[] | null) ?? []).forEach((row) => {
    ;(row.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
  })

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ja'))
}

// タグで絞った公開記事の一覧。
export async function fetchPostsByTag(tag: string): Promise<PostCard[]> {
  const { data } = await supabase
    .from('posts')
    .select('slug, title, tags, published_at, hero_image_url')
    .not('published_at', 'is', null)
    .contains('tags', [tag])
    .order('published_at', { ascending: false })
    .limit(200)
  return (data as PostCard[] | null) ?? []
}

// サイドカラム用の関連記事。同じタグを持つ公開記事を新しい順に。
export async function fetchRelatedPosts(current: Pick<Post, 'slug' | 'tags'>): Promise<{
  related: PostCard[]
}> {
  const tags = current.tags ?? []
  if (tags.length === 0) return { related: [] }

  const { data } = await supabase
    .from('posts')
    .select('slug, title, tags, published_at')
    .not('published_at', 'is', null)
    .neq('slug', current.slug)
    .overlaps('tags', tags)
    .order('published_at', { ascending: false })
    .limit(3)

  return { related: (data as PostCard[] | null) ?? [] }
}
