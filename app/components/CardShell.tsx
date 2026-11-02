'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  className?: string
  noCard?: boolean
}

export default function CardShell({ children, onClick, className = '', noCard = false }: Props) {
  if (noCard) {
    return (
      <div className={`w-full overflow-x-hidden ${className}`}>
        <div className="pt-2 pb-3 px-2 md:px-4">{children}</div>
      </div>
    )
  }

  // onClick がある = クリック可能なカード。border 色の変化で押せることを示す。
  // 無い = 情報表示のみ。shadow だけで押せる感を出さない。
  const interactive = onClick
    ? ' border border-transparent hover:border-primary cursor-pointer'
    : ''
  return (
    <div className={`w-full mx-auto max-w-[600px] md:px-4 md:py-3 overflow-x-hidden ${className}`}>
      <div
        onClick={onClick}
        className={`bg-white md:rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0px_0px_9px_rgba(187,187,187,0.25)] transition-colors transition-shadow pt-2 pb-3 px-2${interactive}`}
      >
        {children}
      </div>
    </div>
  )
}
