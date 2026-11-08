'use client'

import Link from 'next/link'
import { useDisplayLocale } from '@/lib/useDisplayLocale'

type Props = {
  label?: string
  title: string
  wordCount?: number
  imageSrc?: string
  /** 画像の収め方。default は 'cover'。横長の記事カバーなどは 'contain' で切らずに見せる */
  imageFit?: 'cover' | 'contain'
  isPremium?: boolean
  disabled?: boolean
  href?: string
  onClick?: () => void
  className?: string
}

export default function DeckCard({ label, title, wordCount, imageSrc, imageFit = 'cover', isPremium, disabled, href, onClick, className }: Props) {
  const locale = useDisplayLocale()
  const premiumLabel = locale === 'en' ? 'Premium only' : 'プレミアム限定'
  const wordsLabel = locale === 'en' ? `${wordCount} words` : `${wordCount} 語`
  const displayTitle = label ? `${label} ${title}` : title
  const baseClass = `relative bg-white border border-line rounded-2xl px-2 py-3 flex flex-col items-center justify-center gap-3 overflow-hidden transition-colors ${
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'hover:border-primary active:scale-[0.98] cursor-pointer'
  } ${className ?? ''}`

  const inner = (
    <>
      {isPremium && (
        <span
          aria-label={premiumLabel}
          className="absolute top-0 left-0 size-[30px] rounded-br-[9px] bg-premium flex items-center justify-center"
        >
          <img src="/premium-crown.svg" alt="" width={18} height={18} />
        </span>
      )}
      <p className="text-[18px] font-bold text-[#020617] tracking-[-0.27px] leading-[21px] whitespace-nowrap">
        {displayTitle}
      </p>
      <div className="w-full aspect-[546/400] rounded-lg overflow-hidden">
        {imageSrc && (
          <img src={imageSrc} alt={displayTitle} className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`} />
        )}
      </div>
      {typeof wordCount === 'number' && (
        <p className="py-1 text-[12px] leading-none text-[#62748e] tracking-[-0.18px]">
          {wordsLabel}
        </p>
      )}
    </>
  )

  if (!disabled && href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={baseClass}
    >
      {inner}
    </button>
  )
}
