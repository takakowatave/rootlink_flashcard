/**
 * 検索クエリの入力ガード。UI のあらゆる経路から検索を投げる前に必ずここを通す。
 * かつて app/lib/queryGuard.ts があったが refactor 中 (2026-02-21 commit 11b08ab)
 * に消えていた。RootLink は英語辞書アプリなので日本語 / 記号 / 数字は全て弾く。
 *
 * - sanitizeSearchQuery: input onChange で使う。許可外を strip して typing 段階で
 *   そもそも入らないようにする。
 * - guardQuery: doSearch などから submit 直前に呼ぶ。空 / 長すぎ / 許可外文字を
 *   含む場合を reason 付きで reject する (belt & suspenders)。
 *
 * 許可: 英大小文字 a-zA-Z / 半角スペース / アポストロフィ ' (don't 用) /
 *       ハイフン - (well-known 用)。それ以外は全て弾く。
 */

export const MAX_QUERY_LENGTH = 60

const ALLOWED_CHAR_RE = /^[a-zA-Z\s'-]+$/
const DISALLOWED_CHAR_RE = /[^a-zA-Z\s'-]/g

export type QueryGuardReason = 'EMPTY' | 'NON_ALPHABET' | 'TOO_LONG'

export type QueryGuardResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: QueryGuardReason }

export function sanitizeSearchQuery(v: string): string {
  return v.replace(DISALLOWED_CHAR_RE, '')
}

export function guardQuery(raw: string): QueryGuardResult {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return { ok: false, reason: 'EMPTY' }
  if (trimmed.length > MAX_QUERY_LENGTH) return { ok: false, reason: 'TOO_LONG' }
  if (!ALLOWED_CHAR_RE.test(trimmed)) return { ok: false, reason: 'NON_ALPHABET' }
  return { ok: true, normalized: trimmed.toLowerCase() }
}

/** UI に出すエラーメッセージ (kiko UI ガイドに合わせて中立語) */
export function queryGuardErrorMessage(reason: QueryGuardReason): string {
  switch (reason) {
    case 'EMPTY':
      return '検索したい単語を入力してください'
    case 'NON_ALPHABET':
      return '英字のみで入力してください'
    case 'TOO_LONG':
      return `${MAX_QUERY_LENGTH} 文字以内で入力してください`
  }
}
