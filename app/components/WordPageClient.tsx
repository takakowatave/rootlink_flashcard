'use client'

// wordページのデータ整形担当
// Oxford / rewritten / normalized の辞書データを画面表示用 shape にそろえて EntryCard に渡す

import { useEffect, useMemo, useState } from 'react'
import EntryCard from '@/components/EntryCard'
import UpgradeModal from '@/components/UpgradeModal'
import { toggleSaveStatus, fetchWordlists, updatePinnedSense, fetchWordsByEtymologyPart } from '@/lib/supabaseApi'
import { supabase } from '@/lib/supabaseClient'
import type { LexicalUnit, SimpleLexicalUnit } from '@/types/LexicalUnit'
import type { EtymologyData, EtymologyPart, EtymologyPartType, LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'
import { DISPLAY_LOCALE_STORAGE_KEY, DISPLAY_LOCALE_EVENT_NAME } from '@/types/DisplayLocale'
import type { RewrittenSense, RewrittenSenseGroup, RewrittenPayload } from '@/types/Dictionary'

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
}

// EntryCard に渡す表示用 sense shape
type DisplaySenseItem = {
  senseId: string
  meaning: string
  example?: string
  exampleTranslation?: string
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
  localizedEtymologyJa: LocalizedEtymologyJa | null
}

type OxfordNote = {
  type?: string
  text?: string
}

type OxfordExample = {
  text?: string
}

type OxfordInflection = {
  inflectedForm?: string
}

type OxfordPhrase = {
  text?: string
}

type OxfordSubsense = {
  id?: string
  definitions?: string[]
  shortDefinitions?: string[]
  examples?: OxfordExample[]
  notes?: OxfordNote[]
}

type OxfordSense = {
  id?: string
  definitions?: string[]
  shortDefinitions?: string[]
  examples?: OxfordExample[]
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
  etymologies?: string[]
  inflections?: OxfordInflection[]
}

type OxfordLexicalEntry = {
  lexicalCategory?: {
    id?: string
  }
  entries?: OxfordEntry[]
  phrases?: OxfordPhrase[]
}

type OxfordResult = {
  lexicalEntries?: OxfordLexicalEntry[]
}

type OxfordPayload = {
  ipa?: string
  audio?: { audioPath: string }
  results?: OxfordResult[]
}

type DictionaryInput = OxfordPayload | RewrittenPayload | null | undefined

type WordlistItem = {
  word: string
  saved_id?: string
  pinned_sense_id?: string | null
}

// senseId ごとの grammatical note
type GrammarTagsBySense = Record<string, string[]>

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

// string 配列を安全に読む
function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  )
}

// grammatical note を "no object, with adverbial" -> ["no object", "with adverbial"] に分解
function splitGrammarNoteText(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0)
}

// notes 配列から grammatical note だけを抽出
function readGrammarNoteTexts(notes: OxfordNote[] | undefined): string[] {
  if (!Array.isArray(notes)) return []

  return notes
    .filter(
      (note): note is OxfordNote =>
        note.type === 'grammaticalNote' &&
        typeof note.text === 'string' &&
        note.text.trim().length > 0
    )
    .flatMap((note) => splitGrammarNoteText(note.text ?? ''))
}

// ja 翻訳を { ja } / { translations: { ja } } の両方から拾う
function readJaValue(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined

  if (typeof value.ja === 'string' && value.ja.length > 0) {
    return value.ja
  }

  const translations = isRecord(value.translations) ? value.translations : null

  if (
    translations &&
    typeof translations.ja === 'string' &&
    translations.ja.length > 0
  ) {
    return translations.ja
  }

  return undefined
}

// unknown から語源データを安全に整形
function normalizeEtymologyData(value: unknown): EtymologyData | null {
  if (!isRecord(value)) return null

  // originLanguage は key さえあれば保持する。
  // labelEn / labelJa は片方しかなくても落とさず、ある方で補完する。
  const rawOriginLanguage = isRecord(value.originLanguage)
    ? value.originLanguage
    : null

  const originLanguageKey =
    rawOriginLanguage &&
    typeof rawOriginLanguage.key === 'string' &&
    rawOriginLanguage.key.trim().length > 0
      ? rawOriginLanguage.key.trim()
      : null

  const originLanguageLabelEn =
    rawOriginLanguage &&
    typeof rawOriginLanguage.labelEn === 'string' &&
    rawOriginLanguage.labelEn.trim().length > 0
      ? rawOriginLanguage.labelEn.trim()
      : null

  const originLanguageLabelJa =
    rawOriginLanguage &&
    typeof rawOriginLanguage.labelJa === 'string' &&
    rawOriginLanguage.labelJa.trim().length > 0
      ? rawOriginLanguage.labelJa.trim()
      : null

  const originLanguage =
    originLanguageKey
      ? {
          key: originLanguageKey,
          labelEn:
            originLanguageLabelEn ??
            originLanguageLabelJa ??
            originLanguageKey,
          labelJa:
            originLanguageLabelJa ??
            originLanguageLabelEn ??
            originLanguageKey,
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
          .filter((part): part is NonNullable<typeof part> => part !== null)
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
    return value.trim().length > 0 ? { en: value } : undefined
  }

  if (!isRecord(value)) return undefined

  const translations = isRecord(value.translations) ? value.translations : {}
  const en = typeof value.en === 'string' ? value.en : undefined
  const ja =
    typeof value.ja === 'string'
      ? value.ja
      : typeof translations.ja === 'string'
        ? translations.ja
        : undefined

  if (!en && !ja) return undefined

  return {
    en,
    ja,
  }
}

// locales.ja.senses を senseId で引ける形にする
function readJaLocaleSenseMap(
  value: unknown
): Record<
  string,
  {
    meaning?: string
    exampleTranslation?: string
  }
> {
  if (!isRecord(value)) return {}

  const locales = isRecord(value.locales) ? value.locales : null
  const jaLocale = locales && isRecord(locales.ja) ? locales.ja : null
  const rawSenses =
    jaLocale && isRecord(jaLocale.senses)
      ? (jaLocale.senses as Record<string, unknown>)
      : {}

  return Object.fromEntries(
    Object.entries(rawSenses).map(([senseId, senseValue]) => {
      const safeSense = isRecord(senseValue) ? senseValue : {}

      return [
        senseId,
        {
          meaning:
            typeof safeSense.meaning === 'string'
              ? safeSense.meaning
              : undefined,
          exampleTranslation:
            typeof safeSense.exampleTranslation === 'string'
              ? safeSense.exampleTranslation
              : undefined,
        },
      ]
    })
  )
}

// locales.ja.etymology を読む
function readLocalizedEtymologyJa(value: unknown): LocalizedEtymologyJa | null {
  if (!isRecord(value)) return null

  const locales = isRecord(value.locales) ? value.locales : null
  const jaLocale = locales && isRecord(locales.ja) ? locales.ja : null
  const etymology =
    jaLocale && isRecord(jaLocale.etymology) ? jaLocale.etymology : null

  if (!etymology) return null

  const originLanguageLabel =
    typeof etymology.originLanguageLabel === 'string'
      ? etymology.originLanguageLabel
      : undefined

  const description =
    typeof etymology.description === 'string'
      ? etymology.description
      : undefined

  const sourceMeaning =
    typeof etymology.sourceMeaning === 'string'
      ? etymology.sourceMeaning
      : undefined

  const hook =
    typeof etymology.hook === 'string' ? etymology.hook : undefined

  if (!originLanguageLabel && !description && !sourceMeaning && !hook) {
    return null
  }

  return {
    originLanguageLabel,
    description,
    sourceMeaning,
    hook,
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
  const exampleFromExampleTranslation = readLocalizedExample(
    value.exampleTranslation
  )

  const example =
    exampleFromExample ?? exampleFromExampleTranslation ?? undefined

  return {
    senseId,
    meaning,
    example,
  }
}

// normalize 済みの辞書 shape を内部の多言語 shape にそろえる
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
    localizedEtymologyJa: readLocalizedEtymologyJa(safeValue),
  }
}

// Oxford raw payload を画面用 shape に変換
function toStableId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function readFirstString(values: unknown): string {
  if (!Array.isArray(values)) return ''

  const first = values.find(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  )

  return first?.trim() ?? ''
}

function readFirstExampleText(values: unknown): string | undefined {
  if (!Array.isArray(values)) return undefined

  const first = values.find(
    (item): item is OxfordExample =>
      isRecord(item) &&
      typeof item.text === 'string' &&
      item.text.trim().length > 0
  )

  return first?.text?.trim()
}

function parseOxfordPayload(
  dictionary: OxfordPayload,
  word: string
): ParsedDictionary {
  const results = Array.isArray(dictionary.results) ? dictionary.results : []
  const lexicalEntries = results.flatMap((result) => result.lexicalEntries ?? [])

  const senses: Record<string, ParsedLocalizedSenseItem[]> = {}

  lexicalEntries.forEach((lexicalEntry) => {
    const pos = String(lexicalEntry.lexicalCategory?.id ?? '').toLowerCase()
    if (!pos) return

    const items: ParsedLocalizedSenseItem[] = []

    ;(lexicalEntry.entries ?? []).forEach((entry) => {
      ;(entry.senses ?? []).forEach((sense, senseIndex) => {
        const senseId =
          typeof sense.id === 'string' && sense.id.length > 0
            ? sense.id
            : `${toStableId(word)}__${toStableId(pos)}__${senseIndex + 1}`

        const meaning =
          readFirstString(sense.definitions) ||
          readFirstString(sense.shortDefinitions)

        const example = readFirstExampleText(sense.examples)

        if (meaning) {
          items.push({
            senseId,
            meaning: { en: meaning },
            example: example ? { en: example } : undefined,
          })
        }

        ;(sense.subsenses ?? []).forEach((subsense, subsenseIndex) => {
          const subsenseId =
            typeof subsense.id === 'string' && subsense.id.length > 0
              ? subsense.id
              : `${senseId}__sub__${subsenseIndex + 1}`

          const subsenseMeaning =
            readFirstString(subsense.definitions) ||
            readFirstString(subsense.shortDefinitions)

          const subsenseExample = readFirstExampleText(subsense.examples)

          if (!subsenseMeaning) return

          items.push({
            senseId: subsenseId,
            meaning: { en: subsenseMeaning },
            example: subsenseExample ? { en: subsenseExample } : undefined,
          })
        })
      })
    })

    if (items.length > 0) {
      senses[pos] = items
    }
  })

  const inflections = lexicalEntries.flatMap((lexicalEntry) =>
    (lexicalEntry.entries ?? []).flatMap((entry) =>
      (entry.inflections ?? [])
        .map((item) =>
          typeof item.inflectedForm === 'string' ? item.inflectedForm : ''
        )
        .filter((item): item is string => item.length > 0)
    )
  )

  const etymology =
    lexicalEntries
      .flatMap((lexicalEntry) => lexicalEntry.entries ?? [])
      .flatMap((entry) => entry.etymologies ?? [])
      .find(
        (item): item is string => typeof item === 'string' && item.length > 0
      ) ?? ''

  const lexicalUnits: Array<LexicalUnit | SimpleLexicalUnit> = lexicalEntries
    .flatMap((lexicalEntry) => lexicalEntry.phrases ?? [])
    .map((phrase) => {
      const text = typeof phrase.text === 'string' ? phrase.text.trim() : ''

      if (!text) return null

      return {
        lexicalUnitId: toStableId(text),
        text,
      }
    })
    .filter((item): item is SimpleLexicalUnit => item !== null)

  return {
    inflections: [...new Set(inflections)],
    synonyms: [],
    antonyms: [],
    derivatives: [],
    senses,
    lexicalUnits,
    etymology,
    etymologyData: null,
    localizedEtymologyJa: null,
  }
}

export default function WordPageClient({
  word,
  dictionary,
  savedId,
  initialPinnedSenseId,
  correctedFrom,
}: {
  word: string
  dictionary: DictionaryInput
  savedId?: string | null
  initialPinnedSenseId?: string | null
  correctedFrom?: string
}) {
  // Header と共有する表示言語
  const [displayLocale, setDisplayLocale] = useState<DisplayLocale>('ja')

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

  // Oxford raw / rewritten payload / normalized payload を共通 shape にそろえる
  const parsed = useMemo<ParsedDictionary>(() => {
    if (isOxfordPayload(dictionary)) {
      return parseOxfordPayload(dictionary, word)
    }

    if (isRewrittenPayload(dictionary)) {
      const senseGroups = Array.isArray(dictionary.senseGroups)
        ? dictionary.senseGroups
        : []

      const jaLocaleSenseMap = readJaLocaleSenseMap(dictionary)

      const senses: Record<string, ParsedLocalizedSenseItem[]> = {}

      senseGroups.forEach((group) => {
        const pos = String(group.partOfSpeech ?? '').toLowerCase()
        if (!pos) return

        const items: ParsedLocalizedSenseItem[] = (group.senses ?? []).map(
          (sense) => {
            const senseId = String(sense.senseId ?? '')
            const jaLocaleSense = jaLocaleSenseMap[senseId]

            const meaningEn = readLocalizedText(sense.definition)
            const exampleEn = readLocalizedExample(sense.example)

            const example =
              exampleEn?.en || jaLocaleSense?.exampleTranslation
                ? {
                    en: exampleEn?.en,
                    ja: jaLocaleSense?.exampleTranslation,
                  }
                : undefined

            return {
              senseId,
              meaning: {
                en: meaningEn.en,
                ja: jaLocaleSense?.meaning,
              },
              example,
            }
          }
        )

        const validItems = items.filter(
          (sense) => Boolean(sense.senseId && sense.meaning.en)
        )

        if (validItems.length === 0) return

        senses[pos] = validItems
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
        localizedEtymologyJa: readLocalizedEtymologyJa(dictionary),
      }
    }

    return normalizeParsedDictionary(dictionary)
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
    localizedEtymologyJa,
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
          // 英語例文は常に保持する
          example: sense.example?.en,
          // 日本語モードのときだけ和訳を別フィールドで渡す
          exampleTranslation:
            displayLocale === 'ja' ? sense.example?.ja : undefined,
        })),
      ])
    ) as Record<string, DisplaySenseItem[]>
  }, [displayLocale, senses])

  // Oxford raw から grammatical note を senseId ごとに抽出
// =========================
// grammarTags を senseId 単位で生成する
// - rewritten / normalized を優先
// - なければ Oxford raw fallback
// =========================
const grammarTags = useMemo<GrammarTagsBySense>(() => {
  const result: GrammarTagsBySense = {}

  // =========================
  // ① rewritten / normalized
  // =========================
  if (isRewrittenPayload(dictionary)) {
    // ---- ja locale から取得 ----
    const locales = isRecord(dictionary.locales) ? dictionary.locales : null
    const jaLocale = locales && isRecord(locales.ja) ? locales.ja : null

    const jaSenses =
      jaLocale && isRecord(jaLocale.senses)
        ? (jaLocale.senses as Record<string, unknown>)
        : {}

    Object.entries(jaSenses).forEach(([senseId, value]) => {
      if (!isRecord(value)) return

      if (Array.isArray(value.grammarTags)) {
        const tags = value.grammarTags
          .filter((item): item is string => typeof item === 'string')
          .flatMap((item) => splitGrammarNoteText(item))

        if (tags.length > 0) {
          result[senseId] = [...new Set(tags)]
        }
      }
    })

    return result
  }

  // =========================
  // ② Oxford raw fallback
  // =========================
  if (!isOxfordPayload(dictionary)) {
    return {}
  }

  const results = Array.isArray(dictionary.results) ? dictionary.results : []
  const lexicalEntries = results.flatMap(
    (result) => result.lexicalEntries ?? []
  )

  lexicalEntries.forEach((lexicalEntry) => {
    const pos = String(lexicalEntry.lexicalCategory?.id ?? '').toLowerCase()

    ;(lexicalEntry.entries ?? []).forEach((entry) => {
      ;(entry.senses ?? []).forEach((sense, senseIndex) => {
        const senseId =
          typeof sense.id === 'string' && sense.id.length > 0
            ? sense.id
            : `${toStableId(word)}__${toStableId(pos)}__${senseIndex + 1}`

        const senseTags = readGrammarNoteTexts(sense.notes)

        if (senseTags.length > 0) {
          result[senseId] = [...new Set(senseTags)]
        }

        ;(sense.subsenses ?? []).forEach((subsense, subsenseIndex) => {
          const subsenseId =
            typeof subsense.id === 'string' && subsense.id.length > 0
              ? subsense.id
              : `${senseId}__sub__${subsenseIndex + 1}`

          const subsenseTags = readGrammarNoteTexts(subsense.notes)

          if (subsenseTags.length > 0) {
            result[subsenseId] = [...new Set(subsenseTags)]
          }
        })
      })
    })
  })

  return result
}, [dictionary, word])

  const [savedWords, setSavedWords] = useState<string[]>([])
  const [resolvedSavedId, setResolvedSavedId] = useState<string | null>(savedId ?? null)
  const [resolvedPinnedSenseId, setResolvedPinnedSenseId] = useState<string | null>(initialPinnedSenseId ?? null)

  const firstSenseId = useMemo(() => {
    const firstGroup = Object.values(displaySenses)[0] ?? []
    return firstGroup[0]?.senseId ?? null
  }, [displaySenses])

  const [pinnedSenseId, setPinnedSenseId] = useState<string | null>(
    initialPinnedSenseId ?? null
  )
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCorrectionBanner, setShowCorrectionBanner] = useState(!!correctedFrom)

  // etymology parts ごとにDBから同一ルートを持つ単語を取得して relatedWords を補完
  const [enrichedEtymologyData, setEnrichedEtymologyData] = useState<EtymologyData | null>(null)

  useEffect(() => {
    if (etymologyData?.structure.type !== 'parts') {
      setEnrichedEtymologyData(etymologyData)
      return
    }
    const parts = etymologyData.structure.parts
    Promise.all(parts.map(p => fetchWordsByEtymologyPart(p.text)))
      .then(relatedPerPart => {
        setEnrichedEtymologyData({
          ...etymologyData,
          structure: {
            ...etymologyData.structure,
            parts: parts.map((p, i) => {
              const fetched = relatedPerPart[i]
              if (fetched.length === 0) return p
              const meanings: Record<string, string> = {}
              fetched.forEach(({ word, meaning }) => { if (meaning) meanings[word] = meaning })
              return {
                ...p,
                relatedWords: fetched.map(r => r.word),
                relatedWordMeanings: meanings,
              }
            }),
          },
        } as EtymologyData)
      })
  }, [etymologyData])

  useEffect(() => {
    if (!initialPinnedSenseId) {
      setPinnedSenseId(firstSenseId)
    }
  }, [word, firstSenseId, initialPinnedSenseId])

  // sense のピン留め切り替え担当
  const handleTogglePin = async (senseId: string) => {
    if (senseId === pinnedSenseId) return
    setPinnedSenseId(senseId)
    if (resolvedSavedId) {
      await updatePinnedSense(resolvedSavedId, senseId)
    }
  }


  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return

      const list = (await fetchWordlists(data.user.id)) as WordlistItem[]
      setSavedWords(list.map((item) => item.word))

      // この単語のsavedIdとpinnedSenseIdを取得
      const thisItem = list.find((item) => item.word === word)
      if (thisItem) {
        setResolvedSavedId(thisItem.saved_id ?? null)
        if (thisItem.pinned_sense_id) {
          setResolvedPinnedSenseId(thisItem.pinned_sense_id)
          setPinnedSenseId(thisItem.pinned_sense_id)
        }
      }
    }

    load()
  }, [word])

  // 単語の保存状態切り替え担当
  const handleSave = async () => {
    const isSaved = savedWords.includes(word)

    // 楽観的更新：API応答を待たずに即時UI反映
    setSavedWords((prev) =>
      isSaved ? prev.filter((w) => w !== word) : [...prev, word]
    )

    const result = await toggleSaveStatus({
      word,
      dictionary,
    } as Parameters<typeof toggleSaveStatus>[0])

    if (!result.success) {
      // 失敗したらロールバック
      setSavedWords((prev) =>
        isSaved ? [...prev, word] : prev.filter((w) => w !== word)
      )
      if (result.limitReached) setShowUpgradeModal(true)
    }
  }

  // IPA / audio を決定
  const pronunciation = useMemo(() => {
    // Supabase Storage に保存済みの audioPath があれば優先する
    if (dictionary?.audio?.audioPath) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const audioUrl = `${supabaseUrl}/storage/v1/object/public/${dictionary.audio.audioPath}`
      return {
        phoneticSpelling: dictionary.ipa ?? undefined,
        audioFile: audioUrl,
      }
    }

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
    <div className="min-h-screen bg-[#f8fafc]">
    {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    {showCorrectionBanner && correctedFrom && (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-lg mb-0 mx-4 mt-3">
        <span>
          <span className="font-mono">&ldquo;{correctedFrom}&rdquo;</span> を{' '}
          <span className="font-mono font-medium">&ldquo;{word}&rdquo;</span> に補正して検索しました
        </span>
        <button
          onClick={() => setShowCorrectionBanner(false)}
          className="ml-3 text-amber-600 hover:text-amber-800 text-lg leading-none"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    )}
    <EntryCard
      headword={word}
      pronunciation={pronunciation}
      etymology={etymology}
      etymologyData={enrichedEtymologyData ?? etymologyData}
      localizedEtymologyJa={localizedEtymologyJa}
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
    />
    </div>
  )
}