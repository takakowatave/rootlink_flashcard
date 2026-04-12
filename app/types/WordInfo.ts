/**
 * WordInfo.ts
 * 辞書表示・保存・UIで共通使用する単語型。
 * 「保存一覧」でも使えるよう必須項目を最小化。
 */
import type { SavedWordDictionary } from './Dictionary'

export type PartOfSpeech =
  | 'noun' | 'verb' | 'adjective' | 'adverb'
  | 'adjectival_noun' | 'pronoun' | 'preposition'
  | 'conjunction' | 'interjection' | 'particle'
  | 'auxiliary' | 'article'

export type EtymologyPart = {
  part: string
  meaning: string
  relatedWords: string[]
}

export type EtymologyHook = {
  type: 'A' | 'B' | 'C'
  summary: string
  hookJa: string
  parts?: EtymologyPart[]
}

/**
 * 単語エントリ本体
 * 必須は「word」のみ。
 * それ以外は保存用途でも使えるよう optional。
 */
export type WordInfo = {
  // 保存関連
  saved_id?: string | null
  word_id?: string

  // 見出し語（必須）
  word: string

  // 以下は辞書表示用（任意）
  meaning?: string
  example?: string
  translation?: string
  partOfSpeech?: PartOfSpeech[]
  pronunciation?: {
    phoneticSpelling?: string
    audioFile?: string
  }

  tags?: string[]
  etymology?: string  

  senses?: Record<
    string,
    {
      meaning: string
      example?: string
    }[]
  >

  patterns?: string[]
  etymologyHook?: EtymologyHook
  derivedWords?: WordInfo[]

  /** dictionary_cache に保存された辞書ペイロード（保存トグル時に upsert する） */
  dictionary?: SavedWordDictionary | null
}