'use client'

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  className?: string
  noCard?: boolean
  // ブログ埋め込みなど、白に近い背景の上で使うときに枠線と角丸を付ける
  bordered?: boolean
}

export default function CardShell({ children, onClick, className = '', noCard = false, bordered = false }: Props) {
  if (noCard) {
    return (
      <div className={`w-full overflow-x-hidden ${className}`}>
        <div className="pt-2 pb-3 px-2 md:px-4">{children}</div>
      </div>
    )
  }

  // onClick がある = クリック可能。border 色変化で「押せる」を伝える。
  // bordered 指定 (ブログ埋め込み等) は常時枠を出し、hover 時のみ primary に差し替える。
  // どちらも無しなら従来通り shadow のみ。
  const base = 'bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0px_0px_9px_rgba(187,187,187,0.25)] transition-colors transition-shadow pt-2 pb-3 px-2'
  const shape = bordered ? 'rounded-lg border' : 'md:rounded-lg border border-transparent'
  const borderColor = bordered ? 'border-line' : ''
  const hoverClass = onClick ? 'hover:border-primary cursor-pointer' : ''

  return (
    <div className={`w-full mx-auto max-w-[600px] md:px-4 md:py-3 overflow-x-hidden ${className}`}>
      <div
        onClick={onClick}
        className={`${base} ${shape} ${borderColor} ${hoverClass}`.trim().replace(/\s+/g, ' ')}
      >
        {children}
      </div>
    </div>
  )
}
