'use client'

import { HiChevronRight } from 'react-icons/hi'

type Props = {
  onClick: () => void
}

export default function WordlistEmptyCard({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-line rounded-3xl px-5 py-5 flex items-center gap-4 w-full text-left hover:border-muted transition-colors active:scale-[0.99] cursor-pointer"
    >
      <img
        src="/plant/lv1.png"
        alt=""
        className="size-20 rounded-full object-contain shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-950 mb-1">オリジナル単語帳</p>
        <p className="text-sm text-gray-600 leading-snug mb-2">
          気になる単語を保存して、あなた専用の単語帳を作りましょう
        </p>
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
          検索して追加する
          <HiChevronRight className="size-4" />
        </span>
      </div>
    </button>
  )
}
