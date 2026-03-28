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

// 画面表示で切り替える言語
type DisplayLocale = 'en' | 'ja'

// Header と共有する localStorage key / event name
const DISPLAY_LOCALE_STORAGE_KEY = 'displayLocale'
const DISPLAY_LOCALE_EVENT_NAME = 'display-locale-change'

// 内部で保持する多言語 meaning shape
type LocalizedText = {
  en: string
  ja?: string
}

// 内部で保持する多言語 example shape
type LocalizedExample = {
  en?: string
  ja?: string
}

// 内部の sense shape
type ParsedLocalizedSenseItem = {
  senseId: string
  meaning: LocalizedText
  example?: LocalizedExample
  patterns?: string[]
}

// EntryCard に渡す表示用 sense shape
type DisplaySenseItem = {
  senseId: string
  meaning: string
  example?: string
  patterns?: string[]
}

// rewriteDictionary 後の 1 sense shape
type RewrittenSense = {
  senseId?: string
  definition?: unknown
  example?: unknown
  patterns?: unknown
}

// rewriteDictionary 後の sense group shape
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

// このコンポーネント内で扱う辞書データ shape
type ParsedDictionary = {
  inflections: string[]
  synonyms: string[]
  antonyms: string[]
  derivatives: string[]
  senses: Record<string, ParsedLocalizedSenseItem[]>
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

// rewriteDictionary 後に受け取る payload shape
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

// unknown が object かどうかを判定
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// rewriteDictionary 後の payload かどうかを判定
function isRewrittenPayload(value: DictionaryInput): value is RewrittenPayload {
  return (
    isRecord(value) &&
    'senseGroups' in value &&
    Array.isArray(value.senseGroups)
  )
}

// Oxford raw payload かどうかを判定
function isOxfordPayload(value: DictionaryInput): value is OxfordPayload {
  return isRecord(value) && 'results' in value
}

// lexical unit として最低限必要な shape を持つか判定
function isLexicalUnitLike(
  value: unknown
): value is LexicalUnit | SimpleLexicalUnit {
  return (
    isRecord(value) &&
    typeof value.lexicalUnitId === 'string' &&
    typeof value.text === 'string'
  )
}

// 語源パーツの種別が有効か判定
function isEtymologyPartType(value: unknown): value is EtymologyPartType {
  return (
    value === 'prefix' ||
    value === 'root' ||
    value === 'suffix' ||
    value === 'unknown'
  )
}

// string を安全に読む
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// string 配列を安全に読む
function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  )
}

// ja 翻訳を { ja } / { translations: { ja } } の両方から拾う
function readJaValue(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined

  if (typeof value.ja === 'string' && value.ja.length > 0) {
    return value.ja
  }

  const translations = isRecord(value.translations) ? value.translations : null

  if (translations && typeof translations.ja === 'string' && translations.ja.length > 0) {
    return translations.ja
  }

  return undefined
}

// unknown から語源データを安全に整形
function normalizeEtymologyData(value: unknown): EtymologyData | null {
  if (!isRecord(value)) return null

  const originLanguage =
    isRecord(value.originLanguage) &&
    typeof value.originLanguage.key === 'string' &&
    typeof value.originLanguage.labelEn === 'string' &&
    typeof value.originLanguage.labelJa === 'string'
      ? {
          key: value.originLanguage.key,
          labelEn: value.originLanguage.labelEn,
          labelJa: value.originLanguage.labelJa,
        }
      : null

  const rawEtymology =
    typeof value.rawEtymology === 'string' ? value.rawEtymology : null

  const wordFamily = readStringArray(value.wordFamily)

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
              relatedWords: readStringArray(part.relatedWords),
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
        hook:
          typeof value.structure.hook === 'string' ? value.structure.hook : null,
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
          typeof value.structure.hook === 'string' ? value.structure.hook : null,
      },
    }
  }

  return null
}

// unknown から多言語テキストを安全に読む
function readLocalizedText(value: unknown): LocalizedText {
  if (typeof value === 'string') {
    return { en: value }
  }

  if (!isRecord(value)) {
    return { en: '' }
  }

  return {
    en: typeof value.en === 'string' ? value.en : '',
    ja: readJaValue(value),
  }
}

// unknown から多言語例文を安全に読む
function readLocalizedExample(value: unknown): LocalizedExample | undefined {
  if (typeof value === 'string') {
    return { en: value }
  }

  if (!isRecord(value)) return undefined

  const en = readString(value.en)
  const ja = readJaValue(value)

  if (!en && !ja) return undefined

  return {
    en,
    ja,
  }
}

// sense 1件を内部 shape に寄せる
function readParsedSenseItem(value: unknown): ParsedLocalizedSenseItem | null {
  if (!isRecord(value)) return null

  const senseId = typeof value.senseId === 'string' ? value.senseId : ''
  if (!senseId) return null

  const meaningFromMeaning = readLocalizedText(value.meaning)
  const meaningFromDefinition = readLocalizedText(value.definition)

  const meaning =
    meaningFromMeaning.en.length > 0 ? meaningFromMeaning : meaningFromDefinition

  if (!meaning.en) return null

  const exampleFromExample = readLocalizedExample(value.example)
  const exampleFromExampleTranslation = readLocalizedExample(value.exampleTranslation)

  const example =
    exampleFromExample ?? exampleFromExampleTranslation ?? undefined

  return {
    senseId,
    meaning,
    example,
    patterns: readStringArray(value.patterns),
  }
}

// normalizeDictionary 済みの辞書 shape を内部の多言語 shape にそろえる
function normalizeParsedDictionary(value: unknown): ParsedDictionary {
  const safeValue = isRecord(value) ? value : {}

  const rawSenses = isRecord(safeValue.senses)
    ? (safeValue.senses as Record<string, unknown>)
    : {}

  const senses = Object.fromEntries(
    Object.entries(rawSenses).map(([pos, items]) => {
      const safeItems = Array.isArray(items)
        ? items
            .map((item) => readParsedSenseItem(item))
            .filter(
              (item): item is ParsedLocalizedSenseItem => item !== null
            )
        : []

      return [String(pos).toLowerCase(), safeItems]
    })
  ) as Record<string, ParsedLocalizedSenseItem[]>

  return {
    inflections: readStringArray(safeValue.inflections),
    synonyms: readStringArray(safeValue.synonyms),
    antonyms: readStringArray(safeValue.antonyms),
    derivatives: readStringArray(safeValue.derivatives),
    senses,
    lexicalUnits: Array.isArray(safeValue.lexicalUnits)
      ? safeValue.lexicalUnits.filter(isLexicalUnitLike)
      : [],
    etymology:
      typeof safeValue.etymology === 'string' ? safeValue.etymology : '',
    etymologyData: normalizeEtymologyData(safeValue.etymologyData),
  }
}

// raw payload を normalizeDictionary に通して既存表示 shape にそろえる
function callNormalizeDictionary(
  dictionary: DictionaryInput,
  word: string
): ParsedDictionary {
  type NormalizeDictionaryInput = Parameters<typeof normalizeDictionary>[0]

  const payload = (dictionary ?? {}) as NormalizeDictionaryInput
  const normalized = normalizeDictionary(payload, word)

  return normalizeParsedDictionary(normalized)
}

export default function WordPageClient({
  word,
  dictionary,
}: {
  word: string
  dictionary: DictionaryInput
}) {
  // Header と共有する表示言語
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>('en')

  useEffect(() => {
    const syncDisplayLocale = () => {
      const savedLocale = window.localStorage.getItem(
        DISPLAY_LOCALE_STORAGE_KEY
      )

      if (savedLocale === 'en' || savedLocale === 'ja') {
        setDisplayLocale(savedLocale)
      }
    }

    syncDisplayLocale()

    window.addEventListener(
      DISPLAY_LOCALE_EVENT_NAME,
      syncDisplayLocale as EventListener
    )
    window.addEventListener('storage', syncDisplayLocale)

    return () => {
      window.removeEventListener(
        DISPLAY_LOCALE_EVENT_NAME,
        syncDisplayLocale as EventListener
      )
      window.removeEventListener('storage', syncDisplayLocale)
    }
  }, [])

  // Oxford raw / rewriteDictionary 後の両方を内部の共通 shape にそろえる
  const parsed = useMemo<ParsedDictionary>(() => {
    if (!isRewrittenPayload(dictionary)) {
      return callNormalizeDictionary(dictionary, word)
    }

    const senseGroups = Array.isArray(dictionary.senseGroups)
      ? dictionary.senseGroups
      : []

    const senses: Record<string, ParsedLocalizedSenseItem[]> = {}

    senseGroups.forEach((group) => {
      const pos = String(group.partOfSpeech ?? '').toLowerCase()
      if (!pos) return

      const items = Array.isArray(group.senses)
        ? group.senses
            .map((sense) =>
              readParsedSenseItem({
                senseId: sense.senseId,
                meaning: sense.definition,
                example: sense.example,
                patterns: sense.patterns,
              })
            )
            .filter(
              (item): item is ParsedLocalizedSenseItem => item !== null
            )
        : []

      if (items.length === 0) return

      senses[pos] = items
    })

    return {
      inflections: readStringArray(dictionary.inflections),
      synonyms: readStringArray(dictionary.synonyms),
      antonyms: readStringArray(dictionary.antonyms),
      derivatives: readStringArray(dictionary.derivatives),
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

  // 表示言語に応じて EntryCard 用の string shape に落とす
  const displaySenses = useMemo<Record<string, DisplaySenseItem[]>>(() => {
    return Object.fromEntries(
      Object.entries(senses).map(([pos, items]) => [
        pos,
        items.map((sense) => ({
          senseId: sense.senseId,
          meaning:
            displayLocale === 'ja'
              ? sense.meaning.ja ?? sense.meaning.en
              : sense.meaning.en,
          example:
            displayLocale === 'ja'
              ? sense.example?.ja ?? sense.example?.en
              : sense.example?.en,
          patterns: sense.patterns,
        })),
      ])
    ) as Record<string, DisplaySenseItem[]>
  }, [displayLocale, senses])

  // Oxford raw から grammatical note を抽出
  const grammarTags = useMemo<Record<string, string[]>>(() => {
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
      const pos = String(lexicalEntry.lexicalCategory?.id ?? '').toLowerCase()

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
    const firstGroup = Object.values(displaySenses)[0] ?? []
    return firstGroup[0]?.senseId ?? null
  }, [displaySenses])

  const [pinnedSenseId, setPinnedSenseId] = useState<string | null>(null)

  useEffect(() => {
    setPinnedSenseId(firstSenseId)
  }, [word, firstSenseId])

  const handleTogglePin = (senseId: string) => {
    if (senseId === pinnedSenseId) return
    setPinnedSenseId(senseId)
  }

  // EntryCard の言語トグル変更を state / localStorage / Header 連携に反映
  const handleChangeDisplayLocale = (nextLocale: DisplayLocale) => {
    setDisplayLocale(nextLocale)
    window.localStorage.setItem(DISPLAY_LOCALE_STORAGE_KEY, nextLocale)
    window.dispatchEvent(new Event(DISPLAY_LOCALE_EVENT_NAME))
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

  // IPA / audio を決定
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
      .find((item) => item.audioFile || item.phoneticSpelling)

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
      senses={displaySenses}
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
      displayLocale={displayLocale}
      onChangeDisplayLocale={handleChangeDisplayLocale}
    />
  )
}