import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import type { Post } from '@/lib/blog'
import { BlogDate, BlogTagList } from '@/components/blog/BlogMeta'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '英単語を語源で覚えるブログ',
  description: '語源とUK Englishで、暗記に頼らない英語学習を。RootLink のブログ。',
  alternates: { canonical: '/blog' },
}

export const revalidate = 60

export default async function BlogListPage() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, tags, published_at, created_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(5000)

  if (error) {
    return (
      <main className="max-w-[672px] mx-auto px-4 py-8">
        <p className="text-base text-red-500">記事の取得に失敗しました。</p>
      </main>
    )
  }

  const posts = (data ?? []) as Pick<Post, 'id' | 'title' | 'slug' | 'tags' | 'published_at' | 'created_at'>[]

  return (
    <main className="max-w-[672px] mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-950">Blog</h1>
        <p className="mt-1 text-base text-muted">
          語源とUK Englishで、暗記に頼らない英語学習を。
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-base text-muted">記事はまだありません。</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-line bg-white px-5 py-4 transition-colors hover:border-muted"
              >
                <BlogTagList tags={post.tags} className="mb-2" />
                <h2 className="text-lg font-semibold text-gray-950">{post.title}</h2>
                <BlogDate date={post.published_at ?? post.created_at} className="mt-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
