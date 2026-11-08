import { cookies, headers } from 'next/headers'
import type { DisplayLocale } from '@/types/DisplayLocale'

export const LOCALE_COOKIE_NAME = 'rootlink_locale'

// サーバー側 (RSC / generateMetadata / layout) で locale を決める。
// 優先順:
//   1. URL の ?lang=  (呼び出し側で searchParams から渡す)
//   2. Cookie (rootlink_locale) — クライアント側で選んだら必ずここに書く
//   3. Accept-Language ヘッダ (ja* → ja、以外 → en)
//   4. デフォルト 'ja'
// client 側の detectDisplayLocale と同じ結論に収束させるのが目的。
export function detectServerLocale(opts?: { queryLang?: string }): DisplayLocale {
  const q = opts?.queryLang?.toLowerCase()
  if (q === 'ja' || q === 'en') return q

  try {
    const c = cookies().get(LOCALE_COOKIE_NAME)?.value
    if (c === 'ja' || c === 'en') return c
  } catch {}

  try {
    const al = headers().get('accept-language')?.toLowerCase() ?? ''
    // 最初の tag だけ見る (ja, ja-JP, en-US, ...)
    const first = al.split(',')[0]?.trim() ?? ''
    if (first.startsWith('ja')) return 'ja'
    if (first.startsWith('en')) return 'en'
    // ja が明示的にリストに入っていれば JA
    if (/\bja\b/.test(al)) return 'ja'
    return 'en'
  } catch {}

  return 'ja'
}
