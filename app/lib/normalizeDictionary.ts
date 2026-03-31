/**
 * normalizeDictionary.ts
 *
 * Oxford raw → NormalizedDictionary
 * ・phrase と grammar label を完全分離
 * ・grammar label は Oxford 全構造から抽出（sense / subsense）
 */

import { normalizePOS } from "./pos"
import type { LexicalUnit } from "../types/LexicalUnit"

/** =========================
 * 型
 * ========================= */

export type GrammarLabel = {
  key: string
  en: string
  ja: string
}

export type NormalizedSenseItem = {
  senseId: string
  meaning: string
  example?: string
  patterns?: string[]
  grammarLabels: GrammarLabel[]
}

export type NormalizedDictionary = {
  inflections: string[]
  synonyms: string[]
  antonyms: string[]
  derivatives: string[]
  senses: Record<string, NormalizedSenseItem[]>
  lexicalUnits: LexicalUnit[]
  etymology: string
  etymologyData: {
    parts: {
      text: string
      meaning: string
    }[]
  }
}

/** =========================
 * 入力型
 * ========================= */

type ServerNormalizedSenseItemInput = {
  meaning?: unknown
  example?: unknown
  patterns?: unknown
  grammaticalFeatures?: unknown
  notes?: unknown
  subsenses?: unknown
}

type ServerNormalizedExampleObjectInput = {
  sentence?: unknown
  text?: unknown
  en?: unknown
}

type ServerNormalizedExampleInput = {
  sentence?: unknown
  translation?: unknown
}

type ServerNormalizedMeaningInput = {
  id?: unknown
  meaning?: unknown
  examples?: unknown
}

type ServerNormalizedLexicalUnitInput = {
  phrase?: unknown
  meanings?: unknown
}

type ServerNormalizedDictionaryInput = {
  inflections?: unknown
  synonyms?: unknown
  antonyms?: unknown
  derivatives?: unknown
  senses?: unknown
  lexicalUnits?: unknown
  etymology?: unknown
}

/** =========================
 * ラベル辞書
 * ========================= */

const GRAMMAR_LABEL_MAP: Record<string, { en: string; ja: string }> = {
  "no object": { en: "no object", ja: "目的語を取らない" },
  "with object": { en: "with object", ja: "目的語を取る" },
  "transitive": { en: "transitive", ja: "他動詞" },
  "intransitive": { en: "intransitive", ja: "自動詞" },
  "mass noun": { en: "mass noun", ja: "不可算名詞" },
  "uncountable noun": { en: "uncountable noun", ja: "不可算名詞" },
  "count noun": { en: "count noun", ja: "可算名詞" },
  "predicative": { en: "predicative", ja: "叙述用法" },
  "attributive": { en: "attributive", ja: "限定用法" },
}

/** =========================
 * util
 * ========================= */

function uniqueStrings(values: unknown[]): string[] {
  return [
    ...new Set(
      values
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
    ),
  ]
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** =========================
 * etymology
 * ========================= */

function extractEtymologyParts(
  etymology: string
): { text: string; meaning: string }[] {
  if (!etymology) return []

  const parts: { text: string; meaning: string }[] = []
  const regex = /([a-zA-Z-]+)\s+[‘']([^’']+)[’']/g

  let match: RegExpExecArray | null = null

  while ((match = regex.exec(etymology)) !== null) {
    const rawText = match[1]?.trim() ?? ""
    const meaning = match[2]?.trim() ?? ""

    if (!rawText || !meaning) continue

    parts.push({
      text: rawText.replace(/-$/, ""),
      meaning,
    })
  }

  return parts
}

/** =========================
 * grammar label 抽出（重要）
 * ========================= */

function readLabelText(value: unknown): string[] {
  if (typeof value === "string") return [value]

  if (Array.isArray(value)) {
    return value.flatMap((v) => readLabelText(v))
  }

  if (isRecord(value)) {
    if (typeof value.text === "string") {
      return [value.text]
    }
  }

  return []
}

function extractGrammarLabelsDeep(input: Record<string, unknown>): string[] {
  const result: string[] = []

  result.push(...readLabelText(input.grammaticalFeatures))
  result.push(...readLabelText(input.notes))

  if (Array.isArray(input.subsenses)) {
    for (const sub of input.subsenses) {
      if (isRecord(sub)) {
        result.push(...extractGrammarLabelsDeep(sub))
      }
    }
  }

  return result
}

/** =========================
 * example
 * ========================= */

function readExampleText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (!isRecord(value)) {
    return ""
  }

  const exampleObject = value as ServerNormalizedExampleObjectInput

  if (typeof exampleObject.sentence === "string") {
    return exampleObject.sentence.trim()
  }

  if (typeof exampleObject.text === "string") {
    return exampleObject.text.trim()
  }

  if (typeof exampleObject.en === "string") {
    return exampleObject.en.trim()
  }

  return ""
}

/** =========================
 * sense
 * ========================= */

function _normalizeSenseIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function normalizeSenseItem(
  input: unknown,
  senseId: string
): NormalizedSenseItem | null {
  if (!isRecord(input)) return null

  const meaning = readString(input.meaning)
  if (!meaning) return null

  const example = readExampleText(input.example)

  // 🔥 grammar抽出（完全版）
  const rawLabels = extractGrammarLabelsDeep(input)

  const grammarLabels: GrammarLabel[] = rawLabels
    .map((label) => label.toLowerCase().trim())
    .filter((label) => GRAMMAR_LABEL_MAP[label])
    .map((label) => ({
      key: label,
      en: GRAMMAR_LABEL_MAP[label].en,
      ja: GRAMMAR_LABEL_MAP[label].ja,
    }))

  return {
    senseId,
    meaning,
    example,
    patterns: [],
    grammarLabels,
  }
}

function normalizeSenses(
  sensesInput: unknown,
  word: string
): Record<string, NormalizedSenseItem[]> {
  if (!isRecord(sensesInput)) return {}

  const grouped: Record<string, NormalizedSenseItem[]> = {}

  for (const [rawPos, value] of Object.entries(sensesInput)) {
    if (!Array.isArray(value)) continue

    const posRaw = normalizePOS(rawPos) ?? rawPos
    const posList = Array.isArray(posRaw) ? posRaw : [posRaw]

    const items = value
      .map((item, index) =>
        normalizeSenseItem(
          item,
          `${_normalizeSenseIdPart(word)}__${_normalizeSenseIdPart(rawPos)}__${index + 1}`
        )
      )
      .filter((item): item is NormalizedSenseItem => item !== null)

    if (items.length === 0) continue

    for (const pos of posList) {
      const key = readString(pos)
      if (!key) continue

      if (!grouped[key]) {
        grouped[key] = []
      }

      const existingIds = new Set(grouped[key].map((item) => item.senseId))
      const dedupedItems = items.filter((item) => !existingIds.has(item.senseId))

      grouped[key].push(...dedupedItems)
    }
  }

  return grouped
}

/** =========================
 * lexicalUnits（触らない）
 * ========================= */

function normalizeExample(input: unknown) {
  if (typeof input === "string") {
    const sentence = input.trim()
    if (!sentence) return null

    return { sentence, translation: "" }
  }

  if (!isRecord(input)) return null

  const sentence = readString(input.sentence)
  if (!sentence) return null

  return {
    sentence,
    translation: readString(input.translation),
  }
}

function normalizeMeaning(input: unknown, index: number) {
  if (!isRecord(input)) return null

  const rawMeaning = input.meaning

  let meaningEn = ""
  let meaningJa = ""

  if (typeof rawMeaning === "string") {
    meaningEn = rawMeaning.trim()
  } else if (isRecord(rawMeaning)) {
    meaningEn = readString(rawMeaning.en)
    meaningJa = readString(rawMeaning.ja)
  }

  if (!meaningEn) return null

  const examples = Array.isArray(input.examples)
    ? input.examples
        .map((example) => normalizeExample(example))
        .filter(Boolean)
    : []

  return {
    id: typeof input.id === "number" ? input.id : index,
    meaning: { en: meaningEn, ja: meaningJa },
    examples,
  }
}

function normalizeLexicalUnits(lexicalUnitsInput: unknown): LexicalUnit[] {
  if (!Array.isArray(lexicalUnitsInput)) return []

  return lexicalUnitsInput
    .map((unit) => {
      if (!isRecord(unit)) return null

      const phrase = readString(unit.phrase).toLowerCase()
      if (!phrase) return null

      const meanings = Array.isArray(unit.meanings)
        ? unit.meanings
            .map((meaning, index) => normalizeMeaning(meaning, index))
            .filter(Boolean)
        : []

      if (meanings.length === 0) return null

      return {
        phrase,
        meanings,
      }
    })
    .filter(Boolean) as LexicalUnit[]
}

/** =========================
 * main
 * ========================= */

export function normalizeDictionary(
  dictionary: ServerNormalizedDictionaryInput,
  _word: string
): NormalizedDictionary {
  const etymology = readString(dictionary.etymology)
  const etymologyParts = extractEtymologyParts(etymology)

  return {
    inflections: Array.isArray(dictionary.inflections)
      ? uniqueStrings(dictionary.inflections)
      : [],
    synonyms: Array.isArray(dictionary.synonyms)
      ? uniqueStrings(dictionary.synonyms)
      : [],
    antonyms: Array.isArray(dictionary.antonyms)
      ? uniqueStrings(dictionary.antonyms)
      : [],
    derivatives: Array.isArray(dictionary.derivatives)
      ? uniqueStrings(dictionary.derivatives)
      : [],
    senses: normalizeSenses(dictionary.senses, _word),
    lexicalUnits: normalizeLexicalUnits(dictionary.lexicalUnits),
    etymology,
    etymologyData: {
      parts: etymologyParts,
    },
  }
}