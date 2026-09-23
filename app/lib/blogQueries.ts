import { supabase } from '@/lib/supabaseClient'
import { extractPhraseCardIds, extractWordCardWords, type Post } from '@/lib/blog'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import type { SavedWordDictionary } from '@/types/Dictionary'

export type PostLink = { slug: string; title: string }
export type PostCard = { slug: string; title: string; tags: string[] | null; published_at: string | null }

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

// サイドカラム用。関連記事は同じタグを持つ公開記事、バックナンバーは新着順。
export async function fetchSidebarPosts(current: Pick<Post, 'slug' | 'tags'>): Promise<{
  related: PostCard[]
  backNumbers: PostCard[]
}> {
  const tags = current.tags ?? []
  const [relatedRes, backRes] = await Promise.all([
    tags.length > 0
      ? supabase
          .from('posts')
          .select('slug, title, tags, published_at')
          .not('published_at', 'is', null)
          .neq('slug', current.slug)
          .overlaps('tags', tags)
          .order('published_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: null }),
    supabase
      .from('posts')
      .select('slug, title, tags, published_at')
      .not('published_at', 'is', null)
      .neq('slug', current.slug)
      .order('published_at', { ascending: false })
      .limit(5),
  ])

  return {
    related: (relatedRes.data as PostCard[] | null) ?? [],
    backNumbers: (backRes.data as PostCard[] | null) ?? [],
  }
}
