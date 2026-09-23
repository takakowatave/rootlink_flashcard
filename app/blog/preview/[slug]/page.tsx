import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, type Post } from '@/lib/blog'
import BlogArticle from '@/components/blog/BlogArticle'
import BlogSidebar from '@/components/blog/BlogSidebar'
import { fetchAdjacentPosts, fetchPostEmbeds, fetchSidebarPosts } from '@/lib/blogQueries'
import { BLOG_AUTHOR } from '@/lib/blogAuthor'

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

  const [{ phraseMap, wordCardMap }, { prev, next }, { related, backNumbers }] = await Promise.all([
    fetchPostEmbeds(post.content),
    fetchAdjacentPosts(displayDate),
    fetchSidebarPosts(post),
  ])

  return (
    <div className="mx-auto flex max-w-[1024px] flex-col items-start gap-8 px-4 py-8 lg:flex-row">
      <main className="w-full min-w-0 lg:max-w-[672px]">
        {/* プレビュー用ステータスバー */}
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-quiz-review bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full bg-quiz-review px-2 py-0.5 text-base font-semibold text-white">
              PREVIEW
            </span>
            <span className="truncate text-base text-gray-700">
              {isDraft ? '未公開の下書きです' : '公開済み記事のプレビュー'}
            </span>
          </div>
          {!isDraft && (
            <Link href={`/blog/${post.slug}`} className="shrink-0 text-base text-primary hover:underline">
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
          prev={prev}
          next={next}
          dateNote={isDraft ? <span className="ml-2 text-quiz-review">（下書き・未公開）</span> : null}
        />

        {/* 公開手順ヒント（下書き時のみ） */}
        {isDraft && (
          <div className="mt-8 rounded-2xl border border-line bg-white px-5 py-4 text-base text-gray-600">
            <p className="mb-2 font-semibold text-gray-800">公開手順</p>
            <p>Supabase MCP で下記を実行すると公開されます。</p>
            <pre className="mt-2 overflow-x-auto rounded bg-surface px-3 py-2 text-base text-gray-800">
{`UPDATE posts SET published_at = NOW() WHERE slug = '${post.slug}';`}
            </pre>
          </div>
        )}
      </main>

      <aside className="w-full lg:w-[280px] lg:shrink-0">
        <div className="lg:sticky lg:top-8">
          <BlogSidebar related={related} backNumbers={backNumbers} />
        </div>
      </aside>
    </div>
  )
}
