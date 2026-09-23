import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { extractHeadings, type Post } from '@/lib/blog'
import BlogArticle from '@/components/blog/BlogArticle'
import BlogSidebar from '@/components/blog/BlogSidebar'
import { getHighlightTerms } from '@/lib/blogHighlights'
import { fetchAdjacentPosts, fetchPostEmbeds, fetchRelatedPosts, fetchTagCounts } from '@/lib/blogQueries'
import { BLOG_AUTHOR } from '@/lib/blogAuthor'

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
  // 手動画像がなければ自動生成のカバー画像を使う
  const images = [{ url: post.hero_image_url ?? `https://www.rootlink.app/blog/${post.slug}/cover.png`, width: 1200, height: 630 }]
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
  const [{ phraseMap, wordCardMap }, { prev, next }, { related }, categories] = await Promise.all([
    fetchPostEmbeds(post.content),
    fetchAdjacentPosts(post.published_at!),
    fetchRelatedPosts(post),
    fetchTagCounts(),
  ])

  return (
    <div className="mx-auto flex max-w-[1024px] flex-col items-start gap-8 px-4 py-8 lg:flex-row">
      <main className="w-full min-w-0 lg:max-w-[672px]">
        <nav className="mb-4 text-base">
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
          highlightTerms={getHighlightTerms(params.slug)}
          coverSrc={`/blog/${params.slug}/cover.png`}
        />
      </main>

      <aside className="w-full lg:w-[280px] lg:shrink-0">
        <div className="lg:sticky lg:top-8">
          <BlogSidebar related={related} categories={categories} />
        </div>
      </aside>
    </div>
  )
}
