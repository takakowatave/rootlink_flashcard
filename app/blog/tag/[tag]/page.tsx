import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchPostsByTag, fetchTagCounts } from '@/lib/blogQueries'
import { BlogDate, BlogTagList } from '@/components/blog/BlogMeta'
import BlogThumb from '@/components/blog/BlogThumb'

export const revalidate = 60

type Params = { params: { tag: string } }

function decode(tag: string): string {
  return decodeURIComponent(tag)
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const tag = decode(params.tag)
  return {
    title: `${tag}の記事一覧`,
    description: `${tag}に関する記事の一覧です。語源から英単語の違いと使い分けを解説しています。`,
    alternates: { canonical: `/blog/tag/${encodeURIComponent(tag)}` },
  }
}

export default async function BlogTagPage({ params }: Params) {
  const tag = decode(params.tag)
  const [posts, categories] = await Promise.all([fetchPostsByTag(tag), fetchTagCounts()])
  if (posts.length === 0) notFound()

  return (
    <main className="mx-auto max-w-[672px] px-4 py-8">
      <nav className="mb-4 text-base">
        <Link href="/blog" className="text-muted hover:text-gray-950">
          ← Blog
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-950">{tag}の記事</h1>
        <p className="mt-1 text-base text-muted">{posts.length}件</p>
      </header>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="flex gap-4 rounded-2xl border border-line bg-white px-5 py-4 transition-colors hover:border-muted"
            >
              <BlogThumb slug={post.slug} heroImageUrl={post.hero_image_url} />
              <div className="min-w-0 flex-1">
                <BlogTagList tags={post.tags} className="mb-2" />
                <h2 className="text-lg font-semibold text-gray-950">{post.title}</h2>
                {post.published_at && <BlogDate date={post.published_at} className="mt-2" />}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-2xl border border-line bg-white px-5 py-4">
        <h2 className="mb-3 text-base font-semibold text-gray-950">ほかのカテゴリー</h2>
        <ul className="divide-y divide-line">
          {categories
            .filter((c) => c.tag !== tag)
            .map(({ tag: t, count }) => (
              <li key={t}>
                <Link
                  href={`/blog/tag/${encodeURIComponent(t)}`}
                  className="flex items-center justify-between gap-2 py-2 text-base text-gray-800 hover:text-primary"
                >
                  <span className="truncate">{t}</span>
                  <span className="shrink-0 text-muted">({count})</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </main>
  )
}
