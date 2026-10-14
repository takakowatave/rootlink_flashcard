import { supabase } from './supabaseClient'
import { isNativePlatform } from './isNativePlatform'

/**
 * native (iOS / Android) でセッションが無いときに signInAnonymously で
 * 自動的にゲストとして開始してから続行する共通関数。
 *
 * App Review Guideline 5.1.1(v): アカウントが本質でない機能はログインなしで
 * 使えるようにすること。クイズ・デッキ閲覧・単語検索/保存は本質ではないので、
 * native では「未ログインなら匿名で始める」を既定にする。SignupRequiredModal を
 * native で出さない方針 (kiko 承認, 2026-10-14)。
 *
 * 判定は getUser() ではなく getSession() を使う。getUser() は /user を
 * ネットワーク越しに叩くため、429 やオフライン時に (端末内にセッションが
 * 残っていても) null で返り、「既存ゲストを捨てて新しい匿名ユーザーを作る」
 * データ消失事故につながる。getSession() は端末内 Preferences の内容だけを
 * 見るので、ネットワーク状況に左右されない。
 *
 * また、同時に複数箇所から呼ばれたときに signInAnonymously が重複発火して
 * 匿名ユーザーが複数作られないよう、実行中の Promise をモジュールスコープで
 * 共有する (fetch dedupe)。
 *
 * 戻り値:
 *   true  → セッション有り (既存ログイン / 匿名サインインに成功)。
 *           呼び出し側は supabase.auth.getUser() を叩き直して進めてよい。
 *   false → セッション無し (Web + ゲスト不可、または匿名サインインに失敗)。
 *           呼び出し側は従来どおり SignupRequiredModal を出す。
 */

let inflight: Promise<boolean> | null = null

export async function ensureNativeGuestSession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return true
  if (!isNativePlatform()) return false
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.warn('[auth] signInAnonymously failed:', error.message)
        return false
      }
      return true
    } finally {
      inflight = null
    }
  })()
  return inflight
}
