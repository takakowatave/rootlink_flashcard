'use client'

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import { toggleSaveStatus, fetchWordlists } from '@/lib/supabaseApi'
import { supabase } from '@/lib/supabaseClient'
import { normalizeDictionary } from '@/lib/normalizeDictionary'
import type { LexicalUnit } from '@/types/LexicalUnit'

type SimpleLexicalUnit = {
  lexicalUnitId: string
  text: string
}

// MVP で使う対応言語を表す。
type SupportedLocale = 'ja'

// 英語本文と翻訳群をまとめる shape を表す。
type LocalizedText = {
  en?: string
  translations?: Partial<Record<SupportedLocale, string>>
}

// 英語例文と翻訳群をまとめる shape を表す。
type LocalizedExample = {
  en?: string | null
  translations?: Partial<Record<SupportedLocale, string | null>>
}

// rewriteDictionary 後の 1 sense shape を表す。
type RewrittenSense = {
  senseId?: string
  definition?: LocalizedText
  example?: LocalizedExample
  patterns?: string[]
}

// rewriteDictionary 後の sense group shape を表す。
type RewrittenSenseGroup = {
  partOfSpeech?: string
  senses?: RewrittenSense[]
}

type EtymologyPartType = 'prefix' | 'root' | 'suffix' | 'unknown'

type OriginLanguage = {
  key: string
  labelEn: string
  labelJa: string
}

type EtymologyPart = {
  text: string
  partType: EtymologyPartType
  meaning: string | null
  meaningJa: string | null
  relatedWords: string[]
  order: number
}

type PartsEtymologyStructure = {
  type: 'parts'
  parts: EtymologyPart[]
  hook: string | null
}

type OriginEtymologyStructure = {
  type: 'origin'
  sourceWord: string | null
  sourceMeaning: string | null
  hook: string | null
}

type EtymologyData = {
  originLanguage: OriginLanguage | null
  rawEtymology: string | null
  wordFamily: string[]
  structure: PartsEtymologyStructure | OriginEtymologyStructure
}

// EntryCard に渡すための簡易 sense shape を表す。
type ParsedSenseItem = {
  senseId: string
  meaning: string
  example?: string
  patterns?: string[]
}

// このコンポーネント内で扱う辞書データ shape を表す。
type ParsedDictionary = {
  inflections: string[]
  synonyms: string[]
  antonyms: string[]
  derivatives: string[]
  senses: Record<string, ParsedSenseItem[]>
  lexicalUnits: Array<LexicalUnit | SimpleLexicalUnit>
  etymology: string
  etymologyData: EtymologyData | null
}

type OxfordNote = {
  type?: string
  text?: string
}

type OxfordSubsense = {
  notes?: OxfordNote[]
}

type OxfordSense = {
  notes?: OxfordNote[]
  subsenses?: OxfordSubsense[]
}

type OxfordPronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

type OxfordEntry = {
  notes?: OxfordNote[]
  senses?: OxfordSense[]
  pronunciations?: OxfordPronunciation[]
}

type OxfordLexicalEntry = {
  lexicalCategory?: {
    id?: string
  }
  entries?: OxfordEntry[]
}

type OxfordResult = {
  lexicalEntries?: OxfordLexicalEntry[]
}

type OxfordPayload = {
  ipa?: string
  results?: OxfordResult[]
}

// rewriteDictionary 後に受け取る payload shape を表す。
type RewrittenPayload = {
  senseGroups?: RewrittenSenseGroup[]
  inflections?: string[]
  synonyms?: string[]
  antonyms?: string[]
  derivatives?: string[]
  lexicalUnits?: Array<LexicalUnit | SimpleLexicalUnit>
  etymology?: string
  etymologyData?: EtymologyData | null
  ipa?: string
}

type DictionaryInput = OxfordPayload | RewrittenPayload | null | undefined

type WordlistItem = {
  word: string
}

// unknown が object かどうかを判定する。
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// rewriteDictionary 後の payload かどうかを判定する。
function isRewrittenPayload(value: DictionaryInput): value is RewrittenPayload {
  return isRecord(value) && 'senseGroups' in value && Array.isArray(value.senseGroups)
}

// Oxford raw payload かどうかを判定する。
function isOxfordPayload(value: DictionaryInput): value is OxfordPayload {
  return isRecord(value) && 'results' in value
}

// lexical unit っぽい object かどうかを判定する。
function isLexicalUnitLike(value: unknown): value is LexicalUnit | SimpleLexicalUnit {
  return isRecord(value)
}

// 語源パーツの種別が有効か判定する。
function isEtymologyPartType(value: unknown): value is EtymologyPartType {
  return (
    value === 'prefix' ||
    value === 'root' ||
    value === 'suffix' ||
    value === 'unknown'
  )
}

// unknown から語源データを安全に整形する。
function normalizeEtymologyData(value: unknown): EtymologyData | null {
  if (!isRecord(value)) return null

  const originLanguage = isRecord(value.originLanguage)
    && typeof value.originLanguage.key === 'string'
    && typeof value.originLanguage.labelEn === 'string'
    && typeof value.originLanguage.labelJa === 'string'
    ? {
        key: value.originLanguage.key,
        labelEn: value.originLanguage.labelEn,
        labelJa: value.originLanguage.labelJa,
      }
    : null

  const rawEtymology =
    typeof value.rawEtymology === 'string' ? value.rawEtymology : null

  const wordFamily = Array.isArray(value.wordFamily)
    ? value.wordFamily.filter(
        (item): item is string => typeof item === 'string' && item.length > 0
      )
    : []

  if (!isRecord(value.structure) || typeof value.structure.type !== 'string') {
    return null
  }

  if (value.structure.type === 'parts') {
    const parts = Array.isArray(value.structure.parts)
      ? value.structure.parts
          .map((part, index) => {
            if (!isRecord(part) || typeof part.text !== 'string') return null

            return {
              text: part.text,
              partType: isEtymologyPartType(part.partType)
                ? part.partType
                : 'unknown',
              meaning: typeof part.meaning === 'string' ? part.meaning : null,
              meaningJa:
                typeof part.meaningJa === 'string' ? part.meaningJa : null,
              relatedWords: Array.isArray(part.relatedWords)
                ? part.relatedWords.filter(
                    (item): item is string =>
                      typeof item === 'string' && item.length > 0
                  )
                : [],
              order: typeof part.order === 'number' ? part.order : index,
            }
          })
          .filter((part): part is EtymologyPart => part !== null)
      : []

    return {
      originLanguage,
      rawEtymology,
      wordFamily,
      structure: {
        type: 'parts',
        parts,
        hook: typeof value.structure.hook === 'string'
          ? value.structure.hook
          : null,
      },
    }
  }

  if (value.structure.type === 'origin') {
    return {
      originLanguage,
      rawEtymology,
      wordFamily,
      structure: {
        type: 'origin',
        sourceWord:
          typeof value.structure.sourceWord === 'string'
            ? value.structure.sourceWord
            : null,
        sourceMeaning:
          typeof value.structure.sourceMeaning === 'string'
            ? value.structure.sourceMeaning
            : null,
        hook:
          typeof value.structure.hook === 'string'
            ? value.structure.hook
            : null,
      },
    }
  }

  return null
}

// unknown から normalizeDictionary 済みの辞書 shape を安全に整形する。
function normalizeParsedDictionary(value: unknown): ParsedDictionary {
  const safeValue = isRecord(value) ? value : {}

  const rawSenses = isRecord(safeValue.senses)
    ? (safeValue.senses as Record<string, unknown>)
    : {}

  const senses = Object.fromEntries(
    Object.entries(rawSenses).map(([pos, items]) => {
      const safeItems = Array.isArray(items)
        ? items
            .map((item) => {
              const safeItem = isRecord(item) ? item : {}

              return {
                senseId:
                  typeof safeItem.senseId === 'string' ? safeItem.senseId : '',
                meaning:
                  typeof safeItem.meaning === 'string' ? safeItem.meaning : '',
                example:
                  typeof safeItem.example === 'string'
                    ? safeItem.example
                    : undefined,
                patterns: Array.isArray(safeItem.patterns)
                  ? safeItem.patterns.filter(
                      (pattern): pattern is string =>
                        typeof pattern === 'string' && pattern.length > 0
                    )
                  : [],
              }
            })
            .filter((item) => item.senseId && item.meaning)
        : []

      return [pos, safeItems]
    })
  ) as Record<string, ParsedSenseItem[]>

  return {
    inflections: Array.isArray(safeValue.inflections)
      ? safeValue.inflections.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
      : [],
    synonyms: Array.isArray(safeValue.synonyms)
      ? safeValue.synonyms.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
      : [],
    antonyms: Array.isArray(safeValue.antonyms)
      ? safeValue.antonyms.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
      : [],
    derivatives: Array.isArray(safeValue.derivatives)
      ? safeValue.derivatives.filter(
          (item): item is string => typeof item === 'string' && item.length > 0
        )
      : [],
    senses,
    lexicalUnits: Array.isArray(safeValue.lexicalUnits)
      ? safeValue.lexicalUnits.filter(isLexicalUnitLike)
      : [],
    etymology:
      typeof safeValue.etymology === 'string' ? safeValue.etymology : '',
    etymologyData: normalizeEtymologyData(safeValue.etymologyData),
  }
}

// raw payload を normalizeDictionary に通して既存表示 shape にそろえる。
function callNormalizeDictionary(
  dictionary: DictionaryInput,
  word: string
): ParsedDictionary {
  type NormalizeDictionaryInput = Parameters<typeof normalizeDictionary>[0]

  const payload = (dictionary ??
    {}) as unknown as NormalizeDictionaryInput

  const normalized = normalizeDictionary(payload, word)
  return normalizeParsedDictionary(normalized)
}

// unknown から LocalizedText を安全に読む。
function readLocalizedText(value: unknown): string {
  if (!isRecord(value)) return ''
  return typeof value.en === 'string' ? value.en : ''
}

// unknown から LocalizedExample を安全に読む。
function readLocalizedExample(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  return typeof value.en === 'string' ? value.en : undefined
}

export default function WordPageClient({
  word,
  dictionary,
}: {
  word: string
  dictionary: DictionaryInput
}) {
  const parsed = useMemo<ParsedDictionary>(() => {
    if (!isRewrittenPayload(dictionary)) {
      return callNormalizeDictionary(dictionary, word)
    }

    const senseGroups = Array.isArray(dictionary.senseGroups)
      ? dictionary.senseGroups
      : []

    const senses: Record<string, ParsedSenseItem[]> = {}

    senseGroups.forEach((group) => {
      const pos = String(group?.partOfSpeech ?? '').toLowerCase()
      if (!pos) return

      const items: ParsedSenseItem[] = (group?.senses ?? []).map((sense) => ({
        senseId: String(sense?.senseId ?? ''),
        meaning: readLocalizedText(sense?.definition),
        example: readLocalizedExample(sense?.example),
        patterns: Array.isArray(sense?.patterns) ? sense.patterns : [],
      }))

      const validItems = items.filter(
        (sense) => Boolean(sense.senseId && sense.meaning)
      )

      if (validItems.length === 0) return

      senses[pos] = validItems
    })

    return {
      inflections: Array.isArray(dictionary.inflections)
        ? dictionary.inflections
        : [],
      synonyms: Array.isArray(dictionary.synonyms) ? dictionary.synonyms : [],
      antonyms: Array.isArray(dictionary.antonyms) ? dictionary.antonyms : [],
      derivatives: Array.isArray(dictionary.derivatives)
        ? dictionary.derivatives
        : [],
      senses,
      lexicalUnits: Array.isArray(dictionary.lexicalUnits)
        ? dictionary.lexicalUnits.filter(isLexicalUnitLike)
        : [],
      etymology:
        typeof dictionary.etymology === 'string' ? dictionary.etymology : '',
      etymologyData: normalizeEtymologyData(dictionary.etymologyData),
    }
  }, [dictionary, word])

  const {
    inflections,
    synonyms,
    antonyms,
    derivatives,
    senses,
    lexicalUnits,
    etymology,
    etymologyData,
  } = parsed

  const grammarTags = useMemo(() => {
    if (!isOxfordPayload(dictionary)) {
      return {}
    }

    const results = Array.isArray(dictionary.results) ? dictionary.results : []

    const lexicalEntries = results.flatMap(
      (result) => result.lexicalEntries ?? []
    )

    if (lexicalEntries.length === 0) {
      return {}
    }

    const result: Record<string, string[]> = {}

    lexicalEntries.forEach((lexicalEntry) => {
      const pos = lexicalEntry.lexicalCategory?.id

      const features: string[] = (lexicalEntry.entries ?? [])
        .flatMap((entry) => [
          ...(entry.notes ?? []),
          ...(entry.senses ?? []).flatMap((sense) => [
            ...(sense.notes ?? []),
            ...(sense.subsenses ?? []).flatMap(
              (subsense) => subsense.notes ?? []
            ),
          ]),
        ])
        .filter((note) => note.type === 'grammaticalNote')
        .map((note) => note.text)
        .filter(
          (text): text is string => typeof text === 'string' && text.length > 0
        )

      if (!pos || features.length === 0) return

      result[pos] = [...new Set(features)]
    })

    return result
  }, [dictionary])

  const [savedWords, setSavedWords] = useState<string[]>([])

  const firstSenseId = useMemo(() => {
    const firstGroup = Object.values(senses)[0] ?? []
    return firstGroup[0]?.senseId ?? null
  }, [senses])

  const [pinnedSenseId, setPinnedSenseId] = useState<string | null>(null)

  useEffect(() => {
    setPinnedSenseId(firstSenseId)
  }, [word, firstSenseId])

  const handleTogglePin = (senseId: string) => {
    if (senseId === pinnedSenseId) return
    setPinnedSenseId(senseId)
  }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      const list = (await fetchWordlists(data.user.id)) as WordlistItem[]
      setSavedWords(list.map((item) => item.word))
    }

    load()
  }, [])

  const handleSave = async () => {
    const result = await toggleSaveStatus({
      word,
      dictionary,
    } as Parameters<typeof toggleSaveStatus>[0])

    if (!result.success) return

    const { data } = await supabase.auth.getUser()
    if (!data.user) return

    const list = (await fetchWordlists(data.user.id)) as WordlistItem[]
    setSavedWords(list.map((item) => item.word))
  }

  const pronunciation = useMemo(() => {
    if (dictionary?.ipa) {
      return {
        phoneticSpelling: dictionary.ipa,
        audioFile: undefined,
      }
    }

    if (!isOxfordPayload(dictionary)) {
      return {
        phoneticSpelling: undefined,
        audioFile: undefined,
      }
    }

    const results = Array.isArray(dictionary.results) ? dictionary.results : []

    const lexicalEntries = results.flatMap(
      (result) => result.lexicalEntries ?? []
    )

    const pronunciationItem = lexicalEntries
      .flatMap((lexicalEntry) => lexicalEntry.entries ?? [])
      .flatMap((entry) => entry.pronunciations ?? [])
      .find((item) => item.audioFile)

    return {
      phoneticSpelling: pronunciationItem?.phoneticSpelling,
      audioFile: pronunciationItem?.audioFile,
    }
  }, [dictionary])

  return (
    <EntryCard
      headword={word}
      pronunciation={pronunciation}
      etymology={etymology}
      etymologyData={etymologyData}
      senses={senses}
      lexicalUnits={lexicalUnits}
      inflections={inflections}
      synonyms={synonyms}
      derivatives={derivatives}
      antonyms={antonyms}
      grammarTags={grammarTags}
      isBookmarked={savedWords.includes(word)}
      onSave={handleSave}
      pinnedSenseId={pinnedSenseId}
      onTogglePin={handleTogglePin}
    />
  )
}