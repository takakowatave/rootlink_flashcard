'use client'

import { useEffect, useState } from 'react'
import { DISPLAY_LOCALE_EVENT_NAME, DISPLAY_LOCALE_STORAGE_KEY, type DisplayLocale } from '@/types/DisplayLocale'
import { detectDisplayLocale } from '@/lib/displayLocale'

// 共有の表示言語フック。
// 初回: detectDisplayLocale で localStorage → navigator.language の順で解決。
// 以降: DISPLAY_LOCALE_EVENT_NAME を listen して追従。
// profiles.display_locale への移行後は、このフック内部で profiles を読むように差し替える。
export function useDisplayLocale(): DisplayLocale {
  const [locale, setLocale] = useState<DisplayLocale>('ja')

  useEffect(() => {
    setLocale(detectDisplayLocale())
    const handler = () => {
      const saved = window.localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY)
      if (saved === 'ja' || saved === 'en') setLocale(saved)
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
  }, [])

  return locale
}
