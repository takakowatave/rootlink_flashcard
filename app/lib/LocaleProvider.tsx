'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { DISPLAY_LOCALE_EVENT_NAME, DISPLAY_LOCALE_STORAGE_KEY } from '@/types/DisplayLocale'
import { detectDisplayLocale, writeLocaleCookie } from '@/lib/displayLocale'
import { supabase } from '@/lib/supabaseClient'

// サーバー側で detectServerLocale() の結果を initialLocale として受け取り、
// client で confirm した locale を全ての子に共有する。
// これで Footer / ReportContentLink / Header 等の client component が
// SSR 初回描画から正しい locale を使える。
//
// 優先順:
//   1. profiles.display_locale (ログインユーザーの端末横断保存)
//   2. ?lang= / localStorage / navigator.language (client 側の detectDisplayLocale)
//   3. initialLocale (server 側の detectServerLocale: cookie / Accept-Language)
const LocaleContext = createContext<DisplayLocale>('ja')

export function LocaleProvider({ initialLocale, children }: { initialLocale: DisplayLocale; children: ReactNode }) {
  const [locale, setLocale] = useState<DisplayLocale>(initialLocale)

  useEffect(() => {
    // まず client 側の detect で即反映 (profile fetch 待ちで一瞬ずれないように)。
    const detected = detectDisplayLocale()
    if (detected !== locale) setLocale(detected)
    writeLocaleCookie(detected)

    // ログイン済みなら profiles.display_locale を読み、設定済みならそちらを採用。
    let cancelled = false
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_locale')
        .eq('id', data.user.id)
        .maybeSingle<{ display_locale: DisplayLocale | null }>()
      if (cancelled) return
      const saved = profile?.display_locale
      if (saved === 'ja' || saved === 'en') {
        setLocale(saved)
        writeLocaleCookie(saved)
        // localStorage も揃えておく (同端末の他タブや anonymous 復帰時の初期値に使う)
        try { window.localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, saved) } catch {}
      }
    })

    const handler = () => {
      const saved = window.localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY)
      if (saved === 'ja' || saved === 'en') {
        setLocale(saved)
        writeLocaleCookie(saved)
      }
    }
    window.addEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    return () => {
      cancelled = true
      window.removeEventListener(DISPLAY_LOCALE_EVENT_NAME, handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale(): DisplayLocale {
  return useContext(LocaleContext)
}
