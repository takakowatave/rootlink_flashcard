// types/WordWithType.ts

import type { WordInfo } from './WordInfo'

/**
 * 単語の表示カテゴリ（UI制御用）
 * - main      : メイン単語（タグなし）
 * - synonym   : 類義語
 * - antonym   : 対義語
 */
export type WordType = 'main' | 'synonym' | 'antonym'

/**
 * 表示用の単語型
 * WordInfo + 表示カテゴリ
 */
export type WordWithType = WordInfo & {
  type: WordType
}
