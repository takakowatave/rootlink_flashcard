'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import LPHero from '@/components/LPHero'
import LPAbout from '@/components/LPAbout'
import LPFeatures from '@/components/LPFeatures'
import LPDecks from '@/components/LPDecks'
import LPCta from '@/components/LPCta'
import LPFooter from '@/components/LPFooter'
import LanguageToggle from '@/components/LanguageToggle'
import { HiSearch } from 'react-icons/hi'
import { detectLpLocale, setLpLocaleInUrl } from '@/lib/getLpLocale'
import type { DisplayLocale } from '@/types/DisplayLocale'

const API_BASE =
  process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ??
  'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

// ネイティブ (Capacitor WebView) 経路での「ゲストなら /onboarding、
// セッションあれば Dashboard」の判定は HomePageClientFallback に移した。
// LPClient は純粋に Web ランディング描画だけを担当する。
export default function LPClient() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showStickySearch, setShowStickySearch] = useState(false)
  const [locale, setLocale] = useState<DisplayLocale>('en')
  const heroRef = useRef<HTMLDivElement>(null)

  // 初回マウント時にブラウザ言語 / URL から locale を確定する。
  useEffect(() => {
    setLocale(detectLpLocale())
  }, [])

  // <html lang> を locale に追従させる (SEO / アクセシビリティ向け)。
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = locale
  }, [locale])

  const handleLocaleChange = (next: DisplayLocale) => {
    setLocale(next)
    setLpLocaleInUrl(next)
  }

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickySearch(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleSubmit = async () => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })

      if (!res.ok) { setError('NOT_EXIST'); setIsLoading(false); return }

      const r = await res.json()
      if (!r || r.ok !== true || typeof r.redirectTo !== 'string') {
        setError('NOT_EXIST'); setIsLoading(false); return
      }

      router.push(r.redirectTo)
    } catch {
      setError('NOT_EXIST')
      setIsLoading(false)
    }
  }

  return (
    <main>
      {/* 言語トグル。LP 画面右上に固定表示。 */}
      <div className="absolute right-4 top-4 z-30 md:right-6 md:top-6">
        <LanguageToggle value={locale} onChange={handleLocaleChange} />
      </div>

      <div ref={heroRef}>
        <LPHero
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          locale={locale}
        />
      </div>
      <LPAbout locale={locale} />
      <LPFeatures locale={locale} />
      <LPDecks locale={locale} />
      <LPCta locale={locale} />
      <LPFooter locale={locale} />

      {/* SP: ヒーローが見切れたら追従する検索バー */}
      {showStickySearch && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
            className={`flex items-center h-12 bg-white border rounded-full pl-5 pr-3 gap-2 ${error ? 'border-red-400' : 'border-line'}`}
          >
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null) }}
              placeholder={locale === 'en' ? 'Type a word to search' : '単語を入れて検索しよう'}
              disabled={isLoading}
              className="flex-1 min-w-0 text-base text-black bg-transparent outline-none disabled:opacity-50"
            />
            {isLoading ? (
              <svg className="size-5 animate-spin text-muted shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <HiSearch className="size-5 text-muted shrink-0" />
            )}
          </form>
        </div>
      )}
    </main>
  )
}
