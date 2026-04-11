/**
 * Etymology.ts
 * 語源データの共通型
 * EntryCard / WordPageClient で共有する
 */

export type EtymologyPartType = 'prefix' | 'root' | 'suffix' | 'unknown'

export type OriginLanguage = {
  key: string
  labelEn: string
  labelJa: string
}

export type EtymologyPart = {
  text: string
  partType: EtymologyPartType
  meaning: string | null
  meaningJa?: string | null
  relatedWords: string[]
  order: number
}

export type PartsEtymologyStructure = {
  type: 'parts'
  parts: EtymologyPart[]
  hook: string | null
}

export type OriginEtymologyStructure = {
  type: 'origin'
  sourceWord: string | null
  sourceMeaning: string | null
  hook: string | null
}

export type EtymologyData = {
  originLanguage: OriginLanguage | null
  rawEtymology: string | null
  wordFamily: string[]
  structure: PartsEtymologyStructure | OriginEtymologyStructure
}

export type LocalizedEtymologyJa = {
  originLanguageLabel?: string
  description?: string
  sourceMeaning?: string
  hook?: string
}
