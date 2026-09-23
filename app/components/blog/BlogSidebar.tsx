import Link from 'next/link'
import BlogBannerSlot from '@/components/blog/BlogBannerSlot'
import type { PostCard, TagCount } from '@/lib/blogQueries'
import type { ReactNode } from 'react'

type Props = {
  related: PostCard[]
  categories: TagCount[]
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

// 記事ページのサイドカラム。関連記事とカテゴリーとバナー枠を縦に並べる。
export default function BlogSidebar({ related, categories, banner }: Props) {
  if (related.length === 0 && categories.length === 0 && !banner) return null
  return (
    <div className="space-y-6">
      {related.length > 0 && (
        <Section title="関連記事">
          <ul className="space-y-3">
            {related.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block text-sm leading-snug text-gray-600 underline-offset-2 hover:text-primary hover:underline"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {categories.length > 0 && (
        <Section title="カテゴリー">
          <ul className="divide-y divide-line">
            {categories.map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  href={`/blog/tag/${encodeURIComponent(tag)}`}
                  className="flex items-center justify-between gap-2 py-2 text-base text-gray-800 hover:text-primary"
                >
                  <span className="truncate">{tag}</span>
                  <span className="shrink-0 text-muted">({count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <BlogBannerSlot>{banner}</BlogBannerSlot>
    </div>
  )
}
