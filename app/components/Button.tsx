'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

// デザインシステムのボタン。色相はブランド色(primary=#00AD82)に統一し、
// variant で「塗り / 枠線 / テキスト」の見た目を切り替える。
type Variant = 'primary' | 'secondary' | 'tertiary'
type Size = 'xs' | 'sm' | 'md' | 'lg'
type Radius = 'full' | '2xl' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  radius?: Radius
  fullWidth?: boolean
}

// variant ごとの色・塗り
const variantClass: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'bg-white border border-primary text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed',
  tertiary:
    'text-primary hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed',
}

// size ごとの高さ・余白・フォント
const sizeClass: Record<Size, string> = {
  xs: 'h-6 px-2 text-xs font-medium',
  sm: 'h-8 px-4 text-xs font-medium',
  md: 'h-10 px-6 text-sm font-medium',
  lg: 'py-4 px-6 text-base font-bold',
}

// 角丸
const radiusClass: Record<Radius, string> = {
  full: 'rounded-full',
  '2xl': 'rounded-2xl',
  lg: 'rounded-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    radius,
    fullWidth = false,
    className = '',
    children,
    type = 'button',
    ...props
  },
  ref
) {
  // 角丸のデフォルト: lgサイズ(ブロックCTA)は2xl、それ以外はpill
  const resolvedRadius: Radius = radius ?? (size === 'lg' ? '2xl' : 'full')

  const classes = [
    'inline-flex items-center justify-center gap-1 transition-all active:scale-95',
    variantClass[variant],
    sizeClass[size],
    radiusClass[resolvedRadius],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  )
})

export default Button
