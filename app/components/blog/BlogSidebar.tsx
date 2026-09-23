import Link from 'next/link'
import BlogBannerSlot from '@/components/blog/BlogBannerSlot'
import { BlogDate } from '@/components/blog/BlogMeta'
import type { PostCard } from '@/lib/blogQueries'
import type { ReactNode } from 'react'

type Props = {
  related: PostCard[]
  backNumbers: PostCard[]
  banner?: ReactNode
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white px-5 py-4">
      <h2 className="mb-3 text-base font-semibold text-gray-950">{title}</h2>
      {children}
    </section>
  )
}

function PostList({ posts, withDate = false }: { posts: PostCard[]; withDate?: boolean }) {
  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/blog/${post.slug}`} className="block text-base leading-snug text-gray-800 hover:text-primary">
            {post.title}
          </Link>
          {withDate && post.published_at && <BlogDate date={post.published_at} className="mt-1" />}
        </li>
      ))}
    </ul>
  )
}

// 記事ページのサイドカラム。関連記事とバックナンバーとバナー枠を縦に並べる。
export default function BlogSidebar({ related, backNumbers, banner }: Props) {
  if (related.length === 0 && backNumbers.length === 0 && !banner) return null
  return (
    <div className="space-y-6">
      {related.length > 0 && (
        <Section title="関連記事">
          <PostList posts={related} />
        </Section>
      )}
      {backNumbers.length > 0 && (
        <Section title="バックナンバー">
          <PostList posts={backNumbers} withDate />
        </Section>
      )}
      <BlogBannerSlot>{banner}</BlogBannerSlot>
    </div>
  )
}
