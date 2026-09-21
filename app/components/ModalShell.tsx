'use client'

import { useEffect, type ReactNode } from 'react'

type Variant = 'fullscreen' | 'halfsheet'

type Props = {
  open: boolean
  onClose: () => void
  /** ヘッダー左側 (例: SP 戻る / PC 拡大リンクや タイトル) */
  headerLeft?: ReactNode
  /** ヘッダー右側 (例: 共有・閉じる・その他ボタン群) */
  headerRight?: ReactNode
  /** モーダル本文 (スクロール領域) */
  children: ReactNode
  /** PC 最大幅。Tailwind クラス。デフォルト `md:max-w-[720px]` (halfsheet 時は `lg:max-w-[720px]`) */
  maxWidth?: string
  /**
   * fullscreen: SP=全面 / md+=中央ダイアログ (デフォルト)
   * halfsheet:  SP+iPad=下寄せハーフモーダル / lg+=中央ダイアログ
   */
  variant?: Variant
}

/**
 * fullscreen: SP 全面モーダル / PC 中央ダイアログ
 * halfsheet:  SP+iPad は下寄せハーフシート、lg 以上で中央ダイアログ
 * Escape / 外側クリック / body scroll lock を内包
 */
export default function ModalShell({
  open, onClose, headerLeft, headerRight, children, maxWidth, variant = 'fullscreen',
}: Props) {
  const isHalfsheet = variant === 'halfsheet'
  const finalMaxWidth = maxWidth ?? (isHalfsheet ? 'lg:max-w-[720px]' : 'md:max-w-[720px]')
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

  const wrapperClass = isHalfsheet
    ? 'fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6'
    : 'fixed inset-0 z-50 flex items-stretch justify-center md:items-center md:p-6'
  const backdropClass = isHalfsheet
    ? 'absolute inset-0 bg-black/40'
    : 'absolute inset-0 bg-black/40 hidden md:block'
  const panelClass = isHalfsheet
    ? `relative z-10 bg-white w-full max-h-[85dvh] rounded-t-2xl shadow-xl lg:h-auto lg:rounded-2xl lg:max-h-[85dvh] ${finalMaxWidth} flex flex-col overflow-hidden`
    : `relative z-10 bg-white w-full h-full md:h-auto ${finalMaxWidth} md:max-h-[85dvh] md:rounded-2xl md:shadow-xl flex flex-col overflow-hidden`
  const headerClass = isHalfsheet
    ? 'flex items-center justify-between border-b border-line h-12 px-3 flex-shrink-0'
    : 'flex items-center justify-between border-b border-line h-14 md:h-12 px-3 flex-shrink-0'

  return (
    <div className={wrapperClass} onClick={onClose}>
      <div className={backdropClass} />
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        <div className={headerClass}>
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
