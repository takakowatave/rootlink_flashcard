'use client'

import { createContext, useContext } from 'react'
import type { SavedWordDictionary } from '@/types/Dictionary'

export type WordDetailEntry = {
  word: string
  dictionary: SavedWordDictionary | null
  pinned_sense_id?: string | null
}

// クイズ中の単語詳細モーダル。stack ではなく単一 slot を replace 方式で更新する。
// 戻るは常にクイズへ復帰する (1段だけ)。
export type WordDetailContextValue = {
  open: (entry: WordDetailEntry) => void
}

export const WordDetailContext =
  createContext<WordDetailContextValue | null>(null)

export function useWordDetail() {
  return useContext(WordDetailContext)
}
