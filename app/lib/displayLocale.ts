import { DISPLAY_LOCALE_STORAGE_KEY, type DisplayLocale } from '@/types/DisplayLocale'

// 表示言語を決める共通ロジック。
// 1. ユーザーが明示的に選んだ値 (localStorage) があれば優先
// 2. なければブラウザ言語 → ja* → 'ja' / その他 → 'en'
// 3. SSR 時は 'ja'（主要ユーザーが日本語話者のため）
//
// 最終的には profiles.display_locale への移行予定。それまでは localStorage を
// 後方互換の読み取り元として扱う。書き込みは既存コードがそのまま localStorage
// を使うので、このヘルパーは読み取り専用。
export function detectDisplayLocale(): DisplayLocale {
  if (typeof window === 'undefined') return 'ja'
  try {
    const saved = localStorage.getItem(DISPLAY_LOCALE_STORAGE_KEY) as DisplayLocale | null
    if (saved === 'ja' || saved === 'en') return saved
  } catch {}
  const lang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : ''
  return lang.startsWith('ja') ? 'ja' : 'en'
}
