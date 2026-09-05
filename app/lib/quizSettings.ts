import { supabase } from './supabaseClient'

export type QuizDefaultMode = 'example' | 'word'

export type QuizSettings = {
  defaultMode: QuizDefaultMode
  questionCount: number
  autoPlayAudio: boolean
  autoPlayHeadword: boolean
  showJapanese: boolean
}

export const QUIZ_SETTINGS_DEFAULTS: QuizSettings = {
  defaultMode: 'word',
  questionCount: 10,
  autoPlayAudio: false,
  autoPlayHeadword: false,
  showJapanese: true,
}

export async function fetchQuizSettings(userId: string): Promise<QuizSettings> {
  const { data } = await supabase
    .from('profiles')
    .select('quiz_default_mode, quiz_question_count, quiz_auto_play_audio, quiz_auto_play_headword, quiz_show_japanese')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return QUIZ_SETTINGS_DEFAULTS
  return {
    defaultMode: (data.quiz_default_mode as QuizDefaultMode) ?? QUIZ_SETTINGS_DEFAULTS.defaultMode,
    questionCount: data.quiz_question_count ?? QUIZ_SETTINGS_DEFAULTS.questionCount,
    autoPlayAudio: data.quiz_auto_play_audio ?? QUIZ_SETTINGS_DEFAULTS.autoPlayAudio,
    autoPlayHeadword: data.quiz_auto_play_headword ?? QUIZ_SETTINGS_DEFAULTS.autoPlayHeadword,
    showJapanese: data.quiz_show_japanese ?? QUIZ_SETTINGS_DEFAULTS.showJapanese,
  }
}

export async function saveQuizSettings(userId: string, patch: Partial<QuizSettings>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.defaultMode !== undefined) dbPatch.quiz_default_mode = patch.defaultMode
  if (patch.questionCount !== undefined) dbPatch.quiz_question_count = patch.questionCount
  if (patch.autoPlayAudio !== undefined) dbPatch.quiz_auto_play_audio = patch.autoPlayAudio
  if (patch.autoPlayHeadword !== undefined) dbPatch.quiz_auto_play_headword = patch.autoPlayHeadword
  if (patch.showJapanese !== undefined) dbPatch.quiz_show_japanese = patch.showJapanese
  if (Object.keys(dbPatch).length === 0) return
  await supabase.from('profiles').update(dbPatch).eq('id', userId)
}
