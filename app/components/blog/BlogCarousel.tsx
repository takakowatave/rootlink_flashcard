import Link from 'next/link'
import BlogThumb from '@/components/blog/BlogThumb'
import { BlogDate } from '@/components/blog/BlogMeta'
import type { PostCard } from '@/lib/blogQueries'

type Props = {
  posts: PostCard[]
  className?: string
}

// 記事を横スクロールで並べる。
// カード幅を画面幅より狭く固定して、次のカードが少しはみ出して見えるようにする（スワイプできると分かる）。
// 親の左右余白 (px-4) を打ち消して画面端までスクロールさせる。
export default function BlogCarousel({ posts, className }: Props) {
  if (posts.length === 0) return null
  return (
    <ul
      className={`-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 ${className ?? ''}`}
    >
      {posts.map((post) => (
        <li key={post.slug} className="w-[260px] shrink-0 snap-start">
          <Link
            href={`/blog/${post.slug}`}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-muted"
          >
            <BlogThumb
              slug={post.slug}
              heroImageUrl={post.hero_image_url}
              widthClass="w-full"
              framed={false}
              className="border-b border-line"
            />
            <div className="flex flex-1 flex-col gap-2 px-4 py-3">
              <h3 className="line-clamp-3 text-base font-semibold leading-snug text-gray-950">
                {post.title}
              </h3>
              {post.published_at && <BlogDate date={post.published_at} className="mt-auto" />}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
