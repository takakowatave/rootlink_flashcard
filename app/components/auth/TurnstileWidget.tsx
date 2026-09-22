'use client'

import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget (invisible-first captcha).
 *
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY が未設定なら何も出さず、親の captchaToken は
 * 空のまま Supabase を呼ぶことになる。Supabase Dashboard 側で captcha を
 * enable していない状態と組み合わせて、鍵が未配布の間も既存動線を維持する。
 *
 * enable 済みで鍵未配布 (dev preview 等) の場合、Supabase 側で captcha 失敗に
 * なるため、その環境では NEXT_PUBLIC_TURNSTILE_SITE_KEY を必ずセットすること。
 */
type TurnstileGlobal = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string
      callback: (token: string) => void
      'error-callback'?: () => void
      'expired-callback'?: () => void
      theme?: 'auto' | 'light' | 'dark'
      size?: 'normal' | 'compact' | 'invisible' | 'flexible'
    }
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptLoadPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.turnstile) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('turnstile script load failed')))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile script load failed'))
    document.head.appendChild(s)
  })
  return scriptLoadPromise
}

export default function TurnstileWidget({
  onVerify,
}: {
  onVerify: (token: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    if (!containerRef.current) return
    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'auto',
          size: 'flexible',
          callback: (token) => {
            if (!cancelled) onVerify(token)
          },
          'expired-callback': () => {
            if (!cancelled) onVerify('')
          },
          'error-callback': () => {
            if (!cancelled) onVerify('')
          },
        })
      })
      .catch((err) => {
        console.error('[turnstile] load failed:', err)
      })
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
      }
    }
  }, [siteKey, onVerify])

  if (!siteKey) return null
  return <div ref={containerRef} className="mx-auto" />
}
