import Link from 'next/link'
import type { BlogAuthor } from '@/lib/blogAuthor'
import { BlogMetaText } from '@/components/blog/BlogMeta'

type Props = {
  author: BlogAuthor
  className?: string
}

// ブログ記事末尾の「この記事を書いた人」
// seriesHref がある著者 (Cuppa English 等) は、名前と「シリーズをもっと見る」を /cuppa 等にリンクする。
export default function AuthorBox({ author, className }: Props) {
  const nameNode = author.seriesHref ? (
    <Link
      href={author.seriesHref}
      className="text-base font-semibold text-gray-950 underline underline-offset-2 hover:text-primary-dark"
    >
      {author.name}
    </Link>
  ) : (
    <span className="text-base font-semibold text-gray-950">{author.name}</span>
  )

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
        <BlogMetaText>この記事を書いた人</BlogMetaText>
        <p className="mt-0.5">{nameNode}</p>
        <p className="mt-2 text-base leading-relaxed text-gray-700">{author.bio}</p>
        {author.links && author.links.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {author.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-primary-dark"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        {author.seriesHref && (
          <Link
            href={author.seriesHref}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            このシリーズをもっと見る →
          </Link>
        )}
      </div>
    </section>
  )
}
