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

  return (
    <div className={`mx-auto max-w-[600px] md:px-4 md:py-3 overflow-x-hidden ${className}`}>
      <div
        onClick={onClick}
        className={`bg-white md:rounded-lg shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0px_0px_9px_rgba(187,187,187,0.25)] transition-shadow pt-2 pb-3 px-2${onClick ? ' cursor-pointer' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
