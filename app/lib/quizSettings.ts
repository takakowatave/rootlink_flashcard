import { supabase } from './supabaseClient'

export type QuizDefaultMode = 'example' | 'word'

export type QuizSettings = {
  defaultMode: QuizDefaultMode
  questionCount: number
  autoPlayAudio: boolean
  autoPlayHeadword: boolean
}

export const QUIZ_SETTINGS_DEFAULTS: QuizSettings = {
  defaultMode: 'word',
  questionCount: 10,
  autoPlayAudio: false,
  autoPlayHeadword: false,
}

// 問題数は 5 刻み (最小 5)。既存の保存値が 5 の倍数でないときは
// ロード時に丸めて 36 のような中途半端な値がユーザーに見えないようにする。
function normalizeQuestionCount(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5)
}

export async function fetchQuizSettings(userId: string): Promise<QuizSettings> {
  const { data } = await supabase
    .from('profiles')
    .select('quiz_default_mode, quiz_question_count, quiz_auto_play_audio, quiz_auto_play_headword')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return QUIZ_SETTINGS_DEFAULTS
  const rawCount = data.quiz_question_count ?? QUIZ_SETTINGS_DEFAULTS.questionCount
  return {
    defaultMode: (data.quiz_default_mode as QuizDefaultMode) ?? QUIZ_SETTINGS_DEFAULTS.defaultMode,
    questionCount: normalizeQuestionCount(rawCount),
    autoPlayAudio: data.quiz_auto_play_audio ?? QUIZ_SETTINGS_DEFAULTS.autoPlayAudio,
    autoPlayHeadword: data.quiz_auto_play_headword ?? QUIZ_SETTINGS_DEFAULTS.autoPlayHeadword,
  }
}

export async function saveQuizSettings(userId: string, patch: Partial<QuizSettings>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.defaultMode !== undefined) dbPatch.quiz_default_mode = patch.defaultMode
  if (patch.questionCount !== undefined) dbPatch.quiz_question_count = patch.questionCount
  if (patch.autoPlayAudio !== undefined) dbPatch.quiz_auto_play_audio = patch.autoPlayAudio
  if (patch.autoPlayHeadword !== undefined) dbPatch.quiz_auto_play_headword = patch.autoPlayHeadword
  if (Object.keys(dbPatch).length === 0) return
  await supabase.from('profiles').update(dbPatch).eq('id', userId)
}
