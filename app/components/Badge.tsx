import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  /** sm: 通常 (text-xs) / md: 埋め込みカードなど一回り大きく (text-sm) */
  size?: 'sm' | 'md'
  /** 余白・shrink など配置用のクラスのみ。見た目のクラスは渡さない */
  className?: string
}

/**
 * 品詞・フレーズ種別・ロケール・レジスターなどのラベル表示用バッジ。
 * 単語カード・フレーズカード・クイズで共通の見た目をここに集約する。
 */
export default function Badge({ children, size = 'sm', className }: BadgeProps) {
  const textSize = size === 'md' ? 'text-sm' : 'text-xs'
  return (
    <span
      className={`inline-flex items-center border border-muted rounded-full px-2 py-1 ${textSize} font-medium text-muted${className ? ` ${className}` : ''}`}
    >
      {children}
    </span>
  )
}
