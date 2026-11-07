import type { DisplayLocale } from '@/types/DisplayLocale'

// LP の言語を決める。
// 1. URL の `?lang=en` / `?lang=ja` があればそれを優先
// 2. なければ navigator.language が ja* → ja、それ以外 → en
// localStorage には保存しない（iOS/Android WebView と Web でサイロが分かれるため）。
// LP は未ログイン前提なので DB にも保存しない。ログイン後は profiles.display_locale を使う。
export function detectLpLocale(): DisplayLocale {
  if (typeof window === 'undefined') return 'en'
  try {
    const url = new URL(window.location.href)
    const q = url.searchParams.get('lang')?.toLowerCase()
    if (q === 'ja' || q === 'en') return q
  } catch {}
  const lang = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase()
  return lang.startsWith('ja') ? 'ja' : 'en'
}

// 言語切替時に URL の ?lang= を書き換える（履歴は積まない）。
export function setLpLocaleInUrl(locale: DisplayLocale) {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('lang', locale)
    window.history.replaceState({}, '', url.toString())
  } catch {}
}
