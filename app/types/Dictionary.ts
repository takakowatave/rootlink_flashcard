/**
 * Dictionary.ts
 * 辞書ペイロードの共通型
 * - RewrittenPayload: API / dictionary_cache の完全形
 * - SavedWordDictionary: RewrittenPayload の型エイリアス（後方互換）
 */

import type { EtymologyData } from './Etymology'
import type { LexicalUnit, SimpleLexicalUnit } from './LexicalUnit'

export type RewrittenSense = {
  senseId?: string
  definition?: string
  example?: string
  patterns?: unknown
}

export type RewrittenSenseGroup = {
  partOfSpeech?: string
  senses?: RewrittenSense[]
}

export type RewrittenPayload = {
  senseGroups?: RewrittenSenseGroup[]
  inflections?: string[]
  synonyms?: string[]
  antonyms?: string[]
  derivatives?: string[]
  lexicalUnits?: Array<LexicalUnit | SimpleLexicalUnit>
  etymology?: string
  etymologyData?: EtymologyData | null
  ipa?: string
  audio?: { audioPath: string }
  locales?: {
    ja?: {
      senses?: Record<
        string,
        {
          meaning?: string | null
          exampleTranslation?: string | null
          grammarTags?: string[] | null
        }
      >
      etymology?: {
        originLanguageLabel?: string | null
        description?: string | null
        sourceMeaning?: string | null
        hook?: string | null
      }
    }
  }
}

/** quiz / wordlist で使う型エイリアス（RewrittenPayload と同一） */
export type SavedWordDictionary = RewrittenPayload

// --- 旧 SavedWordSense / SavedWordSenseGroup は型エイリアスとして残す（削除予定） ---
/** @deprecated Use RewrittenSense */
export type SavedWordSense = RewrittenSense
/** @deprecated Use RewrittenSenseGroup */
export type SavedWordSenseGroup = RewrittenSenseGroup
