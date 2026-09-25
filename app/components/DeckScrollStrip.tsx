'use client'

import DeckCard from '@/components/DeckCard'
import DeckLabelBadge from '@/components/DeckLabelBadge'

export type DeckStripItem = {
  key: string
  label?: string
  title: string
  imageSrc?: string
  wordCount?: number
  isPremium?: boolean
  href: string
}

type Props = {
  /** ラベル (TOEIC / IELTS / ...)。未指定なら見出し行を出さない */
  label?: string
  items: DeckStripItem[]
  /** カード幅を大きくしたいときに上書き。default: "w-[146px] sm:w-[180px]" */
  cardWidthClass?: string
}

/**
 * ラベルごとの教材を横スクロールする strip。
 * Dashboard / /decks / LP で共通利用するために切り出したもの。
 * カードサイズは Dashboard に揃えて 146-180px。
 */
export default function DeckScrollStrip({
  label,
  items,
  cardWidthClass = 'w-[146px] sm:w-[180px]',
}: Props) {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      {label && <DeckLabelBadge label={label} />}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {items.map((item) => (
          <DeckCard
            key={item.key}
            label={item.label}
            title={item.title}
            imageSrc={item.imageSrc}
            wordCount={item.wordCount}
            isPremium={item.isPremium}
            href={item.href}
            className={`shrink-0 ${cardWidthClass}`}
          />
        ))}
      </div>
    </section>
  )
}
