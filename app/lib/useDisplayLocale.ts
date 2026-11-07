'use client'

import { useEffect, useState } from 'react'
import { DISPLAY_LOCALE_EVENT_NAME, DISPLAY_LOCALE_STORAGE_KEY, type DisplayLocale } from '@/types/DisplayLocale'
import { detectDisplayLocale, writeLocaleCookie } from '@/lib/displayLocale'

// 共有の表示言語フック。
// 初回: detectDisplayLocale で ?lang → localStorage → navigator.language の順で解決。
// 解決した locale は Cookie に書き、次回アクセスは SSR で即 locale を確定できるように。
// 以降: DISPLAY_LOCALE_EVENT_NAME を listen して追従。
// profiles.display_locale への移行後は、このフック内部で profiles を読むように差し替える。
export function useDisplayLocale(): DisplayLocale {
  const [locale, setLocale] = useState<DisplayLocale>('ja')

  useEffect(() => {
    const detected = detectDisplayLocale()
    setLocale(detected)
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
  }, [])

  return locale
}
