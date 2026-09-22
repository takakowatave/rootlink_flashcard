import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, extractPhraseCardIds, extractWordCardWords, type Post } from '@/lib/blog'
import BlogArticle from '@/components/blog/BlogArticle'
import { BLOG_AUTHOR } from '@/lib/blogAuthor'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'
import type { SavedWordDictionary } from '@/types/Dictionary'

export const revalidate = 60

type Params = { params: { slug: string } }

async function fetchPost(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, content, tags, published_at, created_at, hero_image_url, meta_description')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle()
  return (data as Post | null) ?? null
}

function buildDescription(post: Post): string {
  const manual = post.meta_description?.trim()
  if (manual) return manual
  return post.content.replace(/[#>*`_\[\]()]/g, '').slice(0, 120)
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await fetchPost(params.slug)
  if (!post) return { title: 'Not Found' }
  const description = buildDescription(post)
  const images = post.hero_image_url ? [{ url: post.hero_image_url }] : undefined
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description, type: 'article', images },
    // 手動画像がなくても opengraph-image.tsx が必ず生成されるので large 固定
    twitter: { card: 'summary_large_image', title: post.title, description, images },
  }
}

export default async function BlogPostPage({ params }: Params) {
  const post = await fetchPost(params.slug)
  if (!post) notFound()

  const headings = extractHeadings(post.content)

  // 本文中に埋め込まれた <phrase-card id="..." /> を先にまとめて取得
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

  // <word-card word="..." /> の全単語を dictionary_cache から一括取得。
  // SSR で HTML に焼き込むことで Googlebot が本文として認識できる。
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

  // 前後記事
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, title')
      .not('published_at', 'is', null)
      .lt('published_at', post.published_at!)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('slug, title')
      .not('published_at', 'is', null)
      .gt('published_at', post.published_at!)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <main className="max-w-[672px] mx-auto px-4 py-8">
      <nav className="mb-4 text-sm">
        <Link href="/blog" className="text-muted hover:text-gray-950">
          ← Blog
        </Link>
      </nav>

      <BlogArticle
        post={post}
        displayDate={post.published_at!}
        headings={headings}
        phraseMap={phraseMap}
        wordCardMap={wordCardMap}
        author={BLOG_AUTHOR}
        prev={prev}
        next={next}
      />
    </main>
  )
}
