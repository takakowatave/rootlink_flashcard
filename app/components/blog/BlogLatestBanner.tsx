import Link from 'next/link'
import type { PostCard } from '@/lib/blogQueries'

type Props = {
  post: PostCard
  className?: string
}

// ダッシュボード 試験対策セクションの上に出す「新着英語ブログ」バナー。
// 左: OGP (thumb_image_url → hero_image_url → cover.png)。カード高に揃えて object-cover。
// 右: 「新着英語ブログ」ラベル (ブランド green) + 記事タイトル (2行clamp)。
// 1 枚固定・最新1件 (fetchLatestPost) 専用。
export default function BlogLatestBanner({ post, className }: Props) {
  const src = post.thumb_image_url ?? post.hero_image_url ?? `/blog/${post.slug}/cover.png`
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`flex items-stretch overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-primary ${className ?? ''}`}
    >
      <div className="relative w-[120px] shrink-0 bg-primary-subtle sm:w-[180px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 py-4 pl-4 pr-4 sm:pl-5">
        <p className="text-sm font-semibold text-primary-dark">新着英語ブログ</p>
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-950 sm:text-lg">
          {post.title}
        </h3>
      </div>
    </Link>
  )
}
