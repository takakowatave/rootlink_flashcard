'use client'

import { HiChevronRight } from 'react-icons/hi'
import { useLocale } from '@/lib/LocaleProvider'
import { messages } from '@/lib/i18n/messages'

type Props = {
  onClick: () => void
}

export default function WordlistEmptyCard({ onClick }: Props) {
  const locale = useLocale()
  const t = messages[locale].common
  return (
    <button
      onClick={onClick}
      className="bg-white border border-line rounded-3xl px-5 py-5 flex items-center gap-4 w-full text-left hover:border-primary transition-colors active:scale-[0.99] cursor-pointer"
    >
      <img
        src="/plant/lv1.png"
        alt=""
        className="size-20 rounded-full object-contain shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-950 mb-1">{t.myWordlistTitle}</p>
        <p className="text-sm text-gray-600 leading-snug mb-2">
          {t.myWordlistBody}
        </p>
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
          {t.myWordlistCta}
          <HiChevronRight className="size-4" />
        </span>
      </div>
    </button>
  )
}
