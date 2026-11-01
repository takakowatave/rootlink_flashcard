'use client'

import Link from 'next/link'

type Props = {
  /** 行の左に出す記号。「昨」「週」「月」「全」等 1〜2 文字 */
  badge: string
  label: string
  wordCount: number
  disabled?: boolean
  href: string
}

/**
 * ダッシュボードの「復習」セクション行。
 * デッキ画面の章リスト (ChapterListItem) と同じ 72px 行・左端円バッジ・右端
 * primary-subtle pill の造形で統一する。
 * 進捗ドーナツは「復習に出る候補数」が時間とともに流動するため載せない。
 * 代わりに右の pill に「N 語」を表示する。
 */
export default function ReviewPeriodListItem({ badge, label, wordCount, disabled, href }: Props) {
  const size = 52
  const inner = (
    <div className="w-full h-[72px] flex items-center gap-3 px-2">
      <span
        className="relative shrink-0 grid place-items-center rounded-full bg-primary-subtle"
        style={{ width: size, height: size }}
      >
        <span className="text-base font-bold text-primary-dark tabular-nums">{badge}</span>
      </span>
      <span className="flex-1 text-base font-semibold text-gray-800">{label}</span>
      <span className="shrink-0 text-sm font-semibold text-primary bg-primary-subtle rounded-full px-3 py-1.5 tabular-nums">
        {wordCount} 語
      </span>
    </div>
  )

  const className = `w-full text-left transition-colors ${
    disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary-light'
  }`

  if (disabled) {
    return (
      <div className={className} aria-disabled>
        {inner}
      </div>
    )
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  )
}
