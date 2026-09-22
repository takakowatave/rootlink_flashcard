import type { ReactNode } from 'react'

// ブログ内の「小さい文字」の役割をここに集約する。
// サイズを変えるときはこのファイルだけ直せば、記事・一覧・著者欄すべてに効く。
export const BLOG_META_TEXT = 'text-sm text-muted'

type MetaTextProps = {
  children: ReactNode
  className?: string
}

// 日付・ラベル（目次、前後の記事、この記事を書いた人など）
export function BlogMetaText({ children, className }: MetaTextProps) {
  return <p className={`${BLOG_META_TEXT} ${className ?? ''}`}>{children}</p>
}

// 日付表示
export function BlogDate({ date, className, children }: { date: string; className?: string; children?: ReactNode }) {
  return (
    <BlogMetaText className={className}>
      {new Date(date).toLocaleDateString('ja-JP')}
      {children}
    </BlogMetaText>
  )
}

// タグのチップ
export function BlogTag({ label }: { label: string }) {
  return (
    <span className={`rounded-full border border-line px-2 py-0.5 ${BLOG_META_TEXT}`}>
      {label}
    </span>
  )
}

export function BlogTagList({ tags, className }: { tags: string[] | null; className?: string }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ''}`}>
      {tags.map((tag) => (
        <BlogTag key={tag} label={tag} />
      ))}
    </div>
  )
}
