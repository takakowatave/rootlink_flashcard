'use client'

import { createContext, useContext } from 'react'
import type { SavedWordDictionary } from '@/types/Dictionary'

export type WordDetailStackEntry = {
  word: string
  dictionary: SavedWordDictionary | null
  pinned_sense_id?: string | null
}

export type WordDetailStackContextValue = {
  push: (entry: WordDetailStackEntry) => void
}

export const WordDetailStackContext =
  createContext<WordDetailStackContextValue | null>(null)

export function useWordDetailStack() {
  return useContext(WordDetailStackContext)
}
