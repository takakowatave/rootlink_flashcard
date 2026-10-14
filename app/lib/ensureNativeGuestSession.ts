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
 * 戻り値:
 *   true  → セッション有り (既存ログイン / 匿名サインインに成功)。
 *           呼び出し側は supabase.auth.getUser() を叩き直して進めてよい。
 *   false → セッション無し (Web + ゲスト不可、または匿名サインインに失敗)。
 *           呼び出し側は従来どおり SignupRequiredModal を出す。
 */
export async function ensureNativeGuestSession(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return true
  if (!isNativePlatform()) return false
  const { error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn('[auth] signInAnonymously failed:', error.message)
    return false
  }
  return true
}
