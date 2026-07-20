import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, extractPhraseCardIds, type Post } from '@/lib/blog'
import BlogContent from '../BlogContent'
import Button from '@/components/Button'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'

export const revalidate = 60

type Params = { params: { slug: string } }

async function fetchPost(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, content, tags, published_at, created_at')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle()
  return (data as Post | null) ?? null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await fetchPost(params.slug)
  if (!post) return { title: 'Not Found' }
  const description = post.content.replace(/[#>*`_\[\]()]/g, '').slice(0, 120)
  return {
    title: post.title,
    description,
    openGraph: { title: post.title, description, type: 'article' },
    twitter: { card: 'summary', title: post.title, description },
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
      .select('id, phrase, meaning_ja, example_en, example_ja, senses')
      .in('id', phraseIds)
    if (phrases) {
      phraseMap = Object.fromEntries(
        (phrases as EmbeddedPhrase[]).map((p) => [p.id, p])
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
      <nav className="mb-4 text-xs">
        <Link href="/blog" className="text-muted hover:text-gray-950">
          ← Blog
        </Link>
      </nav>

      <article>
        <div className="rounded-2xl border border-line bg-white px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-8">
            {post.tags && post.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line px-2 py-0.5 text-xs text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-bold leading-tight text-gray-950">{post.title}</h1>
            <p className="mt-3 text-xs text-muted">
              {new Date(post.published_at!).toLocaleDateString('ja-JP')}
            </p>
          </header>

          <div className="prose prose-sm max-w-none
            prose-headings:text-gray-950 prose-headings:font-semibold
            prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-gray-800 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-4 prose-blockquote:border-primary
            prose-blockquote:not-italic prose-blockquote:text-gray-700
            prose-blockquote:bg-primary-subtle prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r
            prose-code:text-primary-dark prose-code:before:content-none prose-code:after:content-none
            prose-hr:border-line
          ">
            <BlogContent content={post.content} phraseMap={phraseMap} />
          </div>
        </div>

        {/* 目次（見出し1つ以上ある記事のみ、本文下・モバイル向け） */}
        {headings.length > 0 && (
          <aside className="mt-10 rounded-2xl border border-line bg-white px-5 py-4">
            <p className="mb-2 text-xs font-semibold text-muted">目次</p>
            <ul className="space-y-1 text-sm">
              {headings.map((h) => (
                <li key={h.id} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
                  <a href={`#${h.id}`} className="text-gray-800 hover:text-primary">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* 末尾 CTA */}
        <div className="mt-10 rounded-2xl border border-line bg-primary-subtle px-5 py-6 text-center">
          <p className="mb-3 text-sm text-gray-800">
            気に入った表現は、RootLink に保存して復習しよう。
          </p>
          <Link href="/signup">
            <Button variant="primary" size="md" radius="lg">
              無料で始める
            </Button>
          </Link>
        </div>

        {/* 前後ナビ */}
        {(prev || next) && (
          <nav className="mt-10 flex items-stretch justify-between gap-3 border-t border-line pt-6">
            {prev ? (
              <Link
                href={`/blog/${prev.slug}`}
                className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-left transition-colors hover:border-muted"
              >
                <p className="text-xs text-muted">← 前の記事</p>
                <p className="mt-1 line-clamp-1 text-sm text-gray-800">{prev.title}</p>
              </Link>
            ) : <span className="flex-1" />}
            {next ? (
              <Link
                href={`/blog/${next.slug}`}
                className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 text-right transition-colors hover:border-muted"
              >
                <p className="text-xs text-muted">次の記事 →</p>
                <p className="mt-1 line-clamp-1 text-sm text-gray-800">{next.title}</p>
              </Link>
            ) : <span className="flex-1" />}
          </nav>
        )}
      </article>
    </main>
  )
}
