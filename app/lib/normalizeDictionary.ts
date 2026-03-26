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
  // backend の sense と対応づけるためのID
  senseId: string
  meaning: string
  example?: string
  patterns?: string[]
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

type ServerNormalizedSenseItemInput = {
  meaning?: unknown
  example?: unknown
  patterns?: unknown
}

type ServerNormalizedExampleObjectInput = {
  sentence?: unknown
  text?: unknown
  en?: unknown
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

function extractEtymologyParts(
  etymology: string
): { text: string; meaning: string }[] {
  if (!etymology) return []

  // 例:
  // from Latin com- ‘together with’ + panis ‘bread’
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

// senseId 用：word / pos を安定したIDパーツに変換する
function _normalizeSenseIdPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

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

function normalizeSenseItem(
  input: unknown,
  senseId: string
): NormalizedSenseItem | null {
  if (!isRecord(input)) return null

  const meaning = readString(input.meaning)
  if (!meaning) return null

  // example は string だけでなく object shape も吸う
  const example = readExampleText(input.example)

  const patterns = Array.isArray(input.patterns)
    ? uniqueStrings(input.patterns)
    : []

  if (example) {
    return {
      senseId,
      meaning,
      example,
      patterns,
    }
  }

  return {
    senseId,
    meaning,
    patterns,
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

    // 各 sense に headword + pos + index ベースのIDを付与する
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

      // 同じ senseId の重複追加を防ぐ
      const existingIds = new Set(grouped[key].map((item) => item.senseId))
      const dedupedItems = items.filter((item) => !existingIds.has(item.senseId))

      grouped[key].push(...dedupedItems)
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
    meaningEn = readString(rawMeaning.en)
    meaningJa = readString(rawMeaning.ja)
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