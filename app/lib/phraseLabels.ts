import type { DisplayLocale } from '@/types/DisplayLocale'

type LocalizedLabel = { en: string; ja: string }

export const TYPE_LABEL: Record<string, LocalizedLabel> = {
  idiom:             { en: 'Idiom',            ja: 'イディオム' },
  phrasal_verb:      { en: 'Phrasal verb',      ja: '句動詞' },
  fixed_expression:  { en: 'Fixed expression',  ja: '固定表現' },
  spoken_expression: { en: 'Spoken expression', ja: '会話表現' },
  collocation:       { en: 'Collocation',       ja: 'コロケーション' },
  pattern:           { en: 'Pattern',           ja: '構文パターン' },
  slang:             { en: 'Slang',             ja: 'スラング' },
}

export const REGISTER_LABEL: Record<string, LocalizedLabel> = {
  formal:   { en: 'Formal',   ja: 'フォーマル' },
  informal: { en: 'Informal', ja: 'カジュアル' },
  slang:    { en: 'Slang',    ja: 'スラング' },
  archaic:  { en: 'Archaic',  ja: '古語' },
  vulgar:   { en: 'Vulgar',   ja: '俗語' },
}

export const LOCALE_LABEL: Record<string, LocalizedLabel> = {
  'en-GB': { en: 'British English',  ja: 'イギリス英語' },
  'en-US': { en: 'American English', ja: 'アメリカ英語' },
}

export function pickLabel(map: Record<string, LocalizedLabel>, key: string | null | undefined, locale: DisplayLocale): string | null {
  if (!key) return null
  const entry = map[key]
  if (!entry) return key
  return locale === 'ja' ? entry.ja : entry.en
}
