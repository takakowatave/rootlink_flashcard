export type LexicalUnitType =
  | 'idiom'
  | 'phrasal_verb'
  | 'fixed_expression'
  | 'spoken_expression'
  | 'collocation'
  | 'pattern'

export type LexicalUnit = {
  phrase: string
  lexicalUnitType: LexicalUnitType
  meaning: string
  examples: {
    sentence: string
    translation: string
  }[]
}

/**
 * 表示用ラベル（日本語）
 * 内部表現は英語、UIでは日本語に変換する
 */
export const LEXICAL_UNIT_LABEL_JA: Record<LexicalUnitType, string> = {
  idiom: 'イディオム',
  phrasal_verb: '句動詞',
  fixed_expression: '定型表現',
  spoken_expression: '話し言葉',
  collocation: 'コロケーション',
  pattern: '構文',
}
