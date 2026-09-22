import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, extractPhraseCardIds, extractWordCardWords, type Post } from '@/lib/blog'
import BlogArticle from '@/components/blog/BlogArticle'
import { BLOG_AUTHOR } from '@/lib/blogAuthor'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import type { SavedWordDictionary } from '@/types/Dictionary'

// プレビュー: 下書き含めて slug で1件取得。SSR キャッシュしない
export const dynamic = 'force-dynamic'
// supabase-js の fetch が Data Cache に載り、下書きを編集しても古い本文が出続けていた。
// プレビューは常に最新を見たいので fetch もキャッシュしない。
export const fetchCache = 'force-no-store'

// プレビュールートは検索エンジンにインデックスさせない
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type Params = { params: { slug: string } }

async function fetchPostAnyStatus(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, content, tags, published_at, created_at, hero_image_url, meta_description')
    .eq('slug', slug)
    .maybeSingle()
  return (data as Post | null) ?? null
}

export default async function BlogPreviewPage({ params }: Params) {
  const post = await fetchPostAnyStatus(params.slug)
  if (!post) notFound()

  const isDraft = post.published_at === null
  const displayDate = post.published_at ?? post.created_at

  const headings = extractHeadings(post.content)

  const phraseIds = extractPhraseCardIds(post.content)
  let phraseMap: Record<string, EmbeddedPhrase> = {}
  if (phraseIds.length > 0) {
    const { data: phrases } = await supabase
      .from('phrase_cards')
      .select('id, phrase, meaning_ja, meaning_en, example_en, example_ja, type, register, locale, senses')
      .in('id', phraseIds)
      .limit(phraseIds.length)
    if (phrases) {
      phraseMap = Object.fromEntries(
        (phrases as EmbeddedPhrase[]).map((p) => [p.id, p])
      )
    }
  }

  const wordCardWords = extractWordCardWords(post.content)
  let wordCardMap: Record<string, SavedWordDictionary | null> = {}
  if (wordCardWords.length > 0) {
    const { data: cachedRows } = await supabase
      .from('words')
      .select('word, dictionary_cache!inner(payload)')
      .in('word', wordCardWords)
      .limit(wordCardWords.length)
    if (cachedRows) {
      wordCardMap = Object.fromEntries(
        (cachedRows as Array<{
          word: string
          dictionary_cache: { payload: SavedWordDictionary | null } | { payload: SavedWordDictionary | null }[] | null
        }>).map((row) => {
          const cache = Array.isArray(row.dictionary_cache) ? row.dictionary_cache[0] : row.dictionary_cache
          return [row.word, (cache?.payload ?? null) as SavedWordDictionary | null]
        })
      )
    }
  }

  return (
    <main className="max-w-[672px] mx-auto px-4 py-8">
      {/* プレビュー用ステータスバー */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-quiz-review bg-white px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded-full bg-quiz-review px-2 py-0.5 text-sm font-semibold text-white shrink-0">
            PREVIEW
          </span>
          <span className="text-sm text-gray-700 truncate">
            {isDraft ? '未公開の下書きです' : '公開済み記事のプレビュー'}
          </span>
        </div>
        {!isDraft && (
          <Link
            href={`/blog/${post.slug}`}
            className="shrink-0 text-sm text-primary hover:underline"
          >
            公開ページを見る →
          </Link>
        )}
      </div>

      <BlogArticle
        post={post}
        displayDate={displayDate}
        headings={headings}
        phraseMap={phraseMap}
        wordCardMap={wordCardMap}
        author={BLOG_AUTHOR}
        dateNote={isDraft ? <span className="ml-2 text-quiz-review">（下書き・未公開）</span> : null}
      />

      {/* 公開手順ヒント（下書き時のみ） */}
      {isDraft && (
        <div className="mt-8 rounded-2xl border border-line bg-white px-5 py-4 text-sm text-gray-600">
          <p className="mb-2 font-semibold text-gray-800">公開手順</p>
          <p>Supabase MCP で下記を実行すると公開されます：</p>
          <pre className="mt-2 overflow-x-auto rounded bg-surface px-3 py-2 text-sm text-gray-800">
{`UPDATE posts SET published_at = NOW() WHERE slug = '${post.slug}';`}
          </pre>
        </div>
      )}
    </main>
  )
}
