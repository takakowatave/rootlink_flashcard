import { supabase } from './supabaseClient'

/**
 * 匿名 (ゲスト) ユーザーが「ログイン・切替え」の操作をしたときに、
 * データ損失の確認モーダルを出すかどうかを決める。
 * saved_words / quiz_results のどちらかが1件でもあればモーダルを出す。
 * 両方0件ならモーダルなしでそのままログインしてよい (kiko 承認, 2026-10-09)。
 */
export async function hasAnyGuestLearningData(userId: string): Promise<boolean> {
  const [savedRes, quizRes] = await Promise.all([
    supabase
      .from('saved_words')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])
  const savedCount = savedRes.count ?? 0
  const quizCount = quizRes.count ?? 0
  return savedCount > 0 || quizCount > 0
}
