/**
 * normalizeDictionary.ts
 *
 * resolveQuery.ts から受け取った Oxford raw と補助データを、
 * rewriteDictionary に渡すための NormalizedDictionary に整形する。
 *
 * Oxford raw から ipa・etymology・senseGroups・lexicalUnits を抽出し、
 * lexicalUnit 候補は constructions → wordFormNote → examples の順で拾う。
 */

import { normalizePOS } from "./pos"
import type { LexicalUnit } from "../types/LexicalUnit"

export type NormalizedSenseItem = {
  meaning: string
  example?: string
  usage?: string[]
}

export type NormalizedDictionary = {
  inflections: string[]
  synonyms: string[]
  antonyms: string[]
  derivatives: string[]
  senses: Record<string, NormalizedSenseItem[]>
  lexicalUnits: LexicalUnit[]
  etymology: string
}

type ServerNormalizedSenseItemInput = {
  meaning?: unknown
  example?: unknown
  usage?: unknown
}

type ServerNormalizedMeaningTextInput = {
  en?: unknown
  ja?: unknown
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

type NormalizedExample = {
  sentence: string
  translation: string
}

type NormalizedMeaning = {
  id: number
  meaning: {
    en: string
    ja: string
  }
  examples: NormalizedExample[]
}

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

function normalizeSenseItem(input: unknown): NormalizedSenseItem | null {
  if (!isRecord(input)) return null

  const meaning = readString(input.meaning)
  if (!meaning) return null

  const example = readString(input.example)
  const usage = Array.isArray(input.usage) ? uniqueStrings(input.usage) : []

  if (example) {
    return {
      meaning,
      example,
      usage,
    }
  }

  return {
    meaning,
    usage,
  }
}

function normalizeSenses(
  sensesInput: unknown
): Record<string, NormalizedSenseItem[]> {
  if (!isRecord(sensesInput)) return {}

  const grouped: Record<string, NormalizedSenseItem[]> = {}

  for (const [rawPos, value] of Object.entries(sensesInput)) {
    if (!Array.isArray(value)) continue

    const posRaw = normalizePOS(rawPos) ?? rawPos
    const posList = Array.isArray(posRaw) ? posRaw : [posRaw]

    const items = value
      .map((item) => normalizeSenseItem(item))
      .filter((item): item is NormalizedSenseItem => item !== null)

    if (items.length === 0) continue

    for (const pos of posList) {
      const key = readString(pos)
      if (!key) continue

      if (!grouped[key]) {
        grouped[key] = []
      }

      grouped[key].push(...items)
    }
  }

  return grouped
}

function normalizeExample(input: unknown): NormalizedExample | null {
  if (typeof input === "string") {
    const sentence = input.trim()
    if (!sentence) return null

    return {
      sentence,
      translation: "",
    }
  }

  if (!isRecord(input)) return null

  const exampleInput = input as ServerNormalizedExampleInput
  const sentence = readString(exampleInput.sentence)
  if (!sentence) return null

  return {
    sentence,
    translation: readString(exampleInput.translation),
  }
}

function normalizeMeaning(input: unknown, index: number): NormalizedMeaning | null {
  if (!isRecord(input)) return null

  const meaningInput = input as ServerNormalizedMeaningInput
  const rawMeaning = meaningInput.meaning

  let meaningEn = ""
  let meaningJa = ""

  if (typeof rawMeaning === "string") {
    meaningEn = rawMeaning.trim()
  } else if (isRecord(rawMeaning)) {
    const meaningText = rawMeaning as ServerNormalizedMeaningTextInput
    meaningEn = readString(meaningText.en)
    meaningJa = readString(meaningText.ja)
  }

  if (!meaningEn) return null

  const examples = Array.isArray(meaningInput.examples)
    ? meaningInput.examples
        .map((example) => normalizeExample(example))
        .filter((example): example is NormalizedExample => example !== null)
    : []

  return {
    id: typeof meaningInput.id === "number" ? meaningInput.id : index,
    meaning: {
      en: meaningEn,
      ja: meaningJa,
    },
    examples,
  }
}

function normalizeLexicalUnits(lexicalUnitsInput: unknown): LexicalUnit[] {
  if (!Array.isArray(lexicalUnitsInput)) return []

  return lexicalUnitsInput
    .map((unit) => {
      if (!isRecord(unit)) return null

      const lexicalUnitInput = unit as ServerNormalizedLexicalUnitInput
      const phrase = readString(lexicalUnitInput.phrase).toLowerCase()
      if (!phrase) return null

      const meanings = Array.isArray(lexicalUnitInput.meanings)
        ? lexicalUnitInput.meanings
            .map((meaning, index) => normalizeMeaning(meaning, index))
            .filter((meaning): meaning is NormalizedMeaning => meaning !== null)
        : []

      if (meanings.length === 0) return null

      return {
        phrase,
        meanings,
      }
    })
    .filter((unit): unit is LexicalUnit => unit !== null)
}

export function normalizeDictionary(
  dictionary: ServerNormalizedDictionaryInput,
  _word: string
): NormalizedDictionary {
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
    senses: normalizeSenses(dictionary.senses),
    lexicalUnits: normalizeLexicalUnits(dictionary.lexicalUnits),
    etymology: readString(dictionary.etymology),
  }
}