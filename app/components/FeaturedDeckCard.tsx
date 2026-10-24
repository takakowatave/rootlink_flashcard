import Link from 'next/link'
import { buttonClassName } from '@/components/buttonStyles'

type Props = {
  title: string
  description: string
  imageSrc: string
  href: string
  /** 「6表現」などの件数表示。未指定なら出さない */
  countLabel?: string
  ctaLabel?: string
  className?: string
}

// 1つのデッキを大きく紹介するカード。シリーズページなどで「このデッキで学ぶ」導線に使う。
export default function FeaturedDeckCard({
  title,
  description,
  imageSrc,
  href,
  countLabel,
  ctaLabel = 'デッキを見る',
  className,
}: Props) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          width={72}
          height={72}
          className="size-[72px] shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug text-gray-950">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-700">{description}</p>
          {countLabel && <p className="mt-1 text-sm text-muted">{countLabel}</p>}
        </div>
      </div>
      <Link href={href} className={buttonClassName({ size: 'lg', fullWidth: true })}>
        {ctaLabel}
      </Link>
    </div>
  )
}
