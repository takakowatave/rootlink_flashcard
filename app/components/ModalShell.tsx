'use client'

import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  /** ヘッダー左側 (例: SP 戻る / PC 拡大リンクや タイトル) */
  headerLeft?: ReactNode
  /** ヘッダー右側 (例: 共有・閉じる・その他ボタン群) */
  headerRight?: ReactNode
  /** モーダル本文 (スクロール領域) */
  children: ReactNode
  /** PC 最大幅。Tailwind クラス。デフォルト `md:max-w-[720px]` */
  maxWidth?: string
}

/**
 * SP=全面モーダル / PC=中央ダイアログ の共通シェル。
 * - SP: `w-full h-full`、角なし、backdrop なし
 * - PC: `max-w-[720px] max-h-[85dvh]`、`rounded-2xl`、`bg-black/40` backdrop、上下 `my-8` (p-6)
 * - Escape / 外側クリック / body scroll lock を内包
 */
export default function ModalShell({
  open, onClose, headerLeft, headerRight, children, maxWidth = 'md:max-w-[720px]',
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pt-6 md:pb-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 hidden md:block" />
      <div
        className={`relative z-10 bg-white w-full h-full md:h-auto ${maxWidth} md:max-h-[85dvh] md:rounded-2xl md:shadow-xl flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line h-14 md:h-12 px-3 flex-shrink-0">
          <div className="flex items-center min-w-0">{headerLeft}</div>
          <div className="flex items-center">{headerRight}</div>
        </div>
        <div className="overflow-y-auto flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
