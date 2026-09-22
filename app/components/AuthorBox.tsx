import type { BlogAuthor } from '@/lib/blogAuthor'

type Props = {
  author: BlogAuthor
  className?: string
}

// ブログ記事末尾の「この記事を書いた人」
export default function AuthorBox({ author, className }: Props) {
  return (
    <section
      aria-label="この記事を書いた人"
      className={`flex items-start gap-4 rounded-2xl border border-line bg-white px-5 py-5 ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={author.avatarSrc}
        alt={author.name}
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="text-xs text-muted">この記事を書いた人</p>
        <p className="mt-0.5 text-base font-semibold text-gray-950">{author.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-700">{author.bio}</p>
      </div>
    </section>
  )
}
