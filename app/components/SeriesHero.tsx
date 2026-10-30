import type { BlogAuthor } from '@/lib/blogAuthor'
import { buttonClassName } from '@/components/buttonStyles'

type Props = {
  author: BlogAuthor
  className?: string
}

// シリーズ（Cuppa English など）のページ冒頭。アイコン・名前・紹介文・SNS リンク。
// 背景はシリーズのトーンに合わせた淡い水色。
export default function SeriesHero({ author, className }: Props) {
  return (
    <section
      className={`flex flex-col items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-8 text-center ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={author.avatarSrc}
        alt=""
        width={96}
        height={96}
        className="size-24 rounded-full object-cover"
      />
      <h1 className="text-2xl font-bold text-gray-950">{author.name}</h1>
      <p className="max-w-[420px] text-base leading-relaxed text-gray-700">{author.bio}</p>
      {author.links && author.links.length > 0 && (
        <ul className="mt-1 flex flex-wrap justify-center gap-2">
          {author.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClassName({ variant: 'secondary', size: 'sm' })}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
