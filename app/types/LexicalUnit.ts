/**
 * WordPageClient と EntryCard で共有するシンプルな熟語型
 * （Oxford raw 形式の phrase のみのフォールバック用）
 */
export type SimpleLexicalUnit = {
  lexicalUnitId: string
  text: string
}

export type LexicalUnitType =
  | 'idiom'
  | 'phrasal_verb'
  | 'fixed_expression'
  | 'spoken_expression'
  | 'collocation'
  | 'pattern'

export type CoreImage = {
  type: 'etymology' | 'core_image'
  text: {
    en: string
    ja: string
  }
}

export type LexicalUnit = {
  phrase: string

  /**
   * 単語：語源フック
   * 熟語：コアイメージ
   */
  coreImage?: CoreImage

  meanings: {
    id: number
    meaning: {
      en: string
      ja: string
    }
    examples: {
      sentence: string
      translation: string
    }[]
  }[]
}

  /**


/**
 * 表示用ラベル（日本語）
 */
export const LEXICAL_UNIT_LABEL_JA: Record<LexicalUnitType, string> = {
  idiom: 'イディオム',
  phrasal_verb: '句動詞',
  fixed_expression: '定型表現',
  spoken_expression: '話し言葉',
  collocation: 'コロケーション',
  pattern: '構文',
}

/**
 * 表示用ラベル（英語）
 */
export const LEXICAL_UNIT_LABEL_EN: Record<LexicalUnitType, string> = {
  idiom: 'Idiom',
  phrasal_verb: 'Phrasal Verb',
  fixed_expression: 'Fixed Expression',
  spoken_expression: 'Spoken Expression',
  collocation: 'Collocation',
  pattern: 'Pattern',
}