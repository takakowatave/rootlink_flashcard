/**
 * WordInfo.ts
 * 単語データの型定義ファイル。
 * AIレスポンス・DB保存・UI表示で共通使用する「単語1件の設計図」。
 * 語源UIの表示構造もここで決まる。
 */

export type PartOfSpeech =
  | 'noun' | 'verb' | 'adjective' | 'adverb'
  | 'adjectival_noun' | 'pronoun' | 'preposition'
  | 'conjunction' | 'interjection' | 'particle'
  | 'auxiliary' | 'article'

/** Type A用：語源パーツ（UIで分解表示する単位） */
export type EtymologyPart = {
  part: string              // 接頭辞・語根（例: "per", "turb"）
  meaning: string           // 短い日本語意味（長文禁止）
  relatedWords: string[]    // 同パーツを持つ関連語（SEO/派生導線）
}

/**
 * 語源構造データ（UI準拠）
 * 上段: summary（1行説明）
 * 中段: parts（Type Aのみ）
 * 下段: hookJa（記憶フック）
 */
export type EtymologyHook = {
  type: 'A' | 'B' | 'C'     // A=分解可, B=語源形のみ, C=イメージ特化
  summary: string           // 語源1行説明（必ず1文）
  hookJa: string            // 記憶補助フック（必ず1文）
  parts?: EtymologyPart[]   // Type Aのみ使用
}

/**
 * 単語エントリ本体。
 * 1単語=1意味の最小単位。将来multi-sense拡張可能。
 */
export type WordInfo = {
  saved_id?: string | null  // 保存レコードID（未保存ならnull）
  word_id?: string          // wordsテーブル主キー

  word: string              // 見出し語（正規化済み）
  meaning: string           // 日本語の短い意味ラベル
  example?: string          // 英語例文
  translation?: string      // 例文訳
  partOfSpeech?: PartOfSpeech[]
  pronunciation?: string

  tags?: string[]           // 任意タグ分類

  etymologyHook?: EtymologyHook  // 語源UI構造
  derivedWords?: WordInfo[]      // 派生語（将来拡張）
}