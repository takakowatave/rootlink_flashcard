import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, extractPhraseCardIds, type Post } from '@/lib/blog'
import BlogContent from '../../BlogContent'
import Button from '@/components/Button'
import type { EmbeddedPhrase } from '@/components/PhraseCardEmbed'

// プレビュー: 下書き含めて slug で1件取得。SSR キャッシュしない
export const dynamic = 'force-dynamic'

// プレビュールートは検索エンジンにインデックスさせない
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type Params = { params: { slug: string } }

async function fetchPostAnyStatus(slug: string): Promise<Post | null> {
  const { data } = await supabase
    .from('posts')
    .select('id, title, slug, content, tags, published_at, created_at')
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
      .select('id, phrase, meaning_ja, example_en, example_ja, senses')
      .in('id', phraseIds)
    if (phrases) {
      phraseMap = Object.fromEntries(
        (phrases as EmbeddedPhrase[]).map((p) => [p.id, p])
      )
    }
  }

  return (
    <main className="max-w-[672px] mx-auto px-4 py-8">
      {/* プレビュー用ステータスバー */}
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-quiz-review bg-white px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded-full bg-quiz-review px-2 py-0.5 text-xs font-semibold text-white shrink-0">
            PREVIEW
          </span>
          <span className="text-xs text-gray-700 truncate">
            {isDraft ? '未公開の下書きです' : '公開済み記事のプレビュー'}
          </span>
        </div>
        {!isDraft && (
          <Link
            href={`/blog/${post.slug}`}
            className="shrink-0 text-xs text-primary hover:underline"
          >
            公開ページを見る →
          </Link>
        )}
      </div>

      <article>
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
            {new Date(displayDate).toLocaleDateString('ja-JP')}
            {isDraft && <span className="ml-2 text-quiz-review">（下書き・未公開）</span>}
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

        {/* 公開手順ヒント（下書き時のみ） */}
        {isDraft && (
          <div className="mt-8 rounded-2xl border border-line bg-white px-5 py-4 text-xs text-gray-600">
            <p className="mb-2 font-semibold text-gray-800">公開手順</p>
            <p>Supabase MCP で下記を実行すると公開されます：</p>
            <pre className="mt-2 overflow-x-auto rounded bg-surface px-3 py-2 text-[11px] text-gray-800">
{`UPDATE posts SET published_at = NOW() WHERE slug = '${post.slug}';`}
            </pre>
          </div>
        )}
      </article>
    </main>
  )
}
