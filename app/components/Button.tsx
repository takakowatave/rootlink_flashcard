'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { buttonClassName, type Variant, type Size, type Radius } from './buttonStyles'

// デザインシステムのボタン。色相はブランド色(primary=#009689)に統一し、
// variant で「塗り / 枠線 / テキスト」の見た目を切り替える。

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  radius?: Radius
  fullWidth?: boolean
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
  const classes = buttonClassName({ variant, size, radius, fullWidth, className })

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {children}
    </button>
  )
})

export default Button
