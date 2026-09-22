'use client'

import Link from 'next/link'
import { HiLockClosed } from 'react-icons/hi'

type Props = {
  chapterNo: number
  label: string
  mastered: number
  total: number
  locked?: boolean
  href?: string
  onClick?: () => void
}

/**
 * デッキ画面の章リスト行。
 * 左に章番号入りの進捗リング、中央に章名、右に「習得済 / 章の語数」。
 * locked=true のときは右側を鍵アイコンに置き換える (課金導線へ)。
 */
export default function ChapterListItem({
  chapterNo, label, mastered, total, locked, href, onClick,
}: Props) {
  const size = 40
  const stroke = 3
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const frac = total > 0 ? Math.min(1, mastered / total) : 0

  const inner = (
    <div className="w-full flex items-center gap-3 py-2 pr-2 pl-1">
      <span className="relative shrink-0 grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="#F0FDFA" stroke="#E2E8F0" strokeWidth={stroke} />
          {frac > 0 && (
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#00d5be" strokeWidth={stroke}
              strokeDasharray={`${frac * circ} ${(1 - frac) * circ}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <span className="absolute text-sm font-bold text-gray-700 tabular-nums">{chapterNo}</span>
      </span>
      <span className="flex-1 text-sm font-semibold text-gray-800">{label}</span>
      {locked ? (
        <span className="shrink-0 grid place-items-center size-8 rounded-full bg-primary-subtle text-primary" aria-label="プレミアム限定">
          <HiLockClosed className="size-4" />
        </span>
      ) : (
        <span className="shrink-0 text-xs font-semibold text-primary bg-primary-subtle rounded-full px-2 py-1 tabular-nums">
          {mastered} / {total}
        </span>
      )}
    </div>
  )

  const className = 'w-full text-left rounded-lg transition-colors hover:bg-gray-50'

  if (href && !onClick) {
    return (
      <Link href={href} className={className}>{inner}</Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}
