'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { DISPLAY_LOCALE_EVENT_NAME, DISPLAY_LOCALE_STORAGE_KEY } from '@/types/DisplayLocale'
import { detectDisplayLocale, writeLocaleCookie } from '@/lib/displayLocale'

// サーバー側で detectServerLocale() の結果を initialLocale として受け取り、
// client で confirm した locale を全ての子に共有する。
// これで Footer / ReportContentLink / Header 等の client component が
// SSR 初回描画から正しい locale を使える。
const LocaleContext = createContext<DisplayLocale>('ja')

export function LocaleProvider({ initialLocale, children }: { initialLocale: DisplayLocale; children: ReactNode }) {
  const [locale, setLocale] = useState<DisplayLocale>(initialLocale)

  useEffect(() => {
    const detected = detectDisplayLocale()
    if (detected !== locale) {
      setLocale(detected)
    }
    writeLocaleCookie(detected)

    const handler = () => {
      const saved = window.localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY)
      if (saved === 'ja' || saved === 'en') {
        setLocale(saved)
        writeLocaleCookie(saved)
      }
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): DisplayLocale {
  return useContext(LocaleContext)
}
