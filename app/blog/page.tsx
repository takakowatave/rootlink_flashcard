import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import type { Post } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog',
  description: '語源とUK Englishで、暗記に頼らない英語学習を。RootLink のブログ。',
}

export const revalidate = 60

export default async function BlogListPage() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, tags, published_at, created_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-[672px] mx-auto px-4 py-8">
        <p className="text-sm text-red-500">記事の取得に失敗しました。</p>
      </main>
    )
  }

  const posts = (data ?? []) as Pick<Post, 'id' | 'title' | 'slug' | 'tags' | 'published_at' | 'created_at'>[]

  return (
    <main className="max-w-[672px] mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-950">Blog</h1>
        <p className="mt-1 text-sm text-muted">
          語源とUK Englishで、暗記に頼らない英語学習を。
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-sm text-muted">記事はまだありません。</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-line bg-white px-5 py-4 transition-colors hover:border-muted"
              >
                {post.tags && post.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
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
                <h2 className="text-lg font-semibold text-gray-950">{post.title}</h2>
                <p className="mt-2 text-xs text-muted">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString('ja-JP')}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
