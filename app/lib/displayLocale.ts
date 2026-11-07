import { DISPLAY_LOCALE_STORAGE_KEY, type DisplayLocale } from '@/types/DisplayLocale'

export const LOCALE_COOKIE_NAME = 'rootlink_locale'

// 表示言語を決める共通ロジック。
// 1. URL の ?lang=  (呼び出し側で明示的に渡す場合はそれを優先)
// 2. ユーザーが明示的に選んだ値 (localStorage) があれば優先
// 3. なければブラウザ言語 → ja* → 'ja' / その他 → 'en'
// 4. SSR 時は 'ja'（主要ユーザーが日本語話者のため）
//
// 最終的には profiles.display_locale への移行予定。それまでは localStorage を
// 後方互換の読み取り元として扱う。
export function detectDisplayLocale(): DisplayLocale {
  if (typeof window === 'undefined') return 'ja'
  try {
    const url = new URL(window.location.href)
    const q = url.searchParams.get('lang')?.toLowerCase()
    if (q === 'ja' || q === 'en') return q
  } catch {}
  try {
    const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
    if (saved === 'ja' || saved === 'en') return saved
  } catch {}
  const lang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : ''
  return lang.startsWith('ja') ? 'ja' : 'en'
}

// Cookie に locale を書いて、次回以降のリクエストがサーバー側で即 locale を
// 確定できるようにする。SSR の最初の HTML が正しい言語で返るのが目的。
// Cookie は 1 年。native (Capacitor WebView) でも `document.cookie` は動く
// (サイロは localStorage と同じく分かれるが、SSR locale は Web だけが見るので問題なし)。
export function writeLocaleCookie(locale: DisplayLocale) {
  if (typeof document === 'undefined') return
  try {
    const maxAge = 60 * 60 * 24 * 365
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${maxAge}; samesite=lax`
  } catch {}
}
