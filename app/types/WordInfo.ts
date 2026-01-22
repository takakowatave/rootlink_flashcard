export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'adjectival_noun'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'particle'
  | 'auxiliary'
  | 'article'

export type EtymologyHook = {
  type: 'A' | 'B' | 'C' | 'D'
  text: string
}

export type WordInfo = {
  /* 保存系 */
  saved_id?: string | null
  word_id?: string

  /* 単語 */
  word: string
  meaning: string
  example?: string
  translation?: string
  partOfSpeech?: PartOfSpeech[]
  pronunciation?: string

  /* 分類 */
  tags?: string[]

  /* ⭐ 追加（今回の肝） */
  etymologyHook?: EtymologyHook
  derivedWords?: WordInfo[]
}
