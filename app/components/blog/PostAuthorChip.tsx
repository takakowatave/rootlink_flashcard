import Link from 'next/link'
import { BLOG_AUTHORS } from '@/lib/blogAuthor'

type Props = {
  authorKey: string | null | undefined
  className?: string
}

// 一覧カード・バナー等の中に置く著者チップ。
// seriesHref がある著者 (例: Cuppa English → /cuppa) のみ描画。
// 親カードが Link で全体ラップされている場合は stretched-link パターンで
// 親側に `relative`、親内の全面 Link に `absolute inset-0 z-0` を付け、
// このチップは `relative z-10` で前面に出す構成を想定。
export default function PostAuthorChip({ authorKey, className }: Props) {
  if (!authorKey) return null
  const author = BLOG_AUTHORS[authorKey]
  if (!author?.seriesHref) return null

  return (
    <Link
      href={author.seriesHref}
      className={`relative z-10 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover ${className ?? ''}`}
    >
      {author.name} →
    </Link>
  )
}
