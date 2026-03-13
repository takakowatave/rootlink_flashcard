/**
 * normalizeDictionary
 *
 * 役割:
 * - Oxford系の辞書データを、RootLink UI が使いやすい形に整形する
 *
 * このファイルでやること:
 * - POSごとの senses を作る
 * - lexicalUnits（熟語 / 句動詞っぽいまとまり）を作る
 * - inflections / derivatives / etymology を UI 用に整える
 *
 * このファイルでやらないこと:
 * - AI生成
 * - DB保存
 * - Oxford API呼び出し
 *
 * 前提:
 * - dictionary は Oxford 構造を持つ
 *   results -> lexicalEntries -> entries -> senses -> subsenses
 * - ただし、inflections / derivatives は top-level で追加されていても読む
 */

import { normalizePOS } from "@/lib/pos"
import type { LexicalUnit } from "@/types/LexicalUnit"

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

/** string配列の trim / 空除外 / 重複除去 */
function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(
    values
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  )]
}

/** regexに入れる単語を安全にescapeする */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * usage label のうち、UIで出さなくてよいものを落とす
 * 例:
 * - mass noun
 * - count noun
 */
function normalizeUsageLabel(text: string): string | null {
  if (!text) return null

  const t = text.trim().toLowerCase()

  if (t === "mass noun") return null
  if (t === "count noun") return null

  return text.trim()
}

/**
 * 1つの sense から usage label を集める
 * - sense.notes
 * - sense.examples[].notes
 */
function extractUsageFromSense(sense: any): string[] {
  const set = new Set<string>()

  for (const note of sense?.notes ?? []) {
    const label = normalizeUsageLabel(note?.text)
    if (label) set.add(label)
  }

  for (const ex of sense?.examples ?? []) {
    for (const note of ex?.notes ?? []) {
      const label = normalizeUsageLabel(note?.text)
      if (label) set.add(label)
    }
  }

  return Array.from(set)
}

/** 熟語候補の文字列を軽く正規化する */
function normalizePattern(text: string): string {
  return text
    .replace(/"/g, "")
    .replace(/,.*$/, "")
    .replace(/^usually\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * example文の中から
 *   add to / add with / add in
 * のような phrase を拾うための regex
 */
function buildPatternRegex(target: string): RegExp {
  const escaped = escapeRegex(target)

  return new RegExp(
    `\\b${escaped}\\s+(with|to|on|about|for|of|in|at|from|that|into|over|under|around|through|after|against|between|by|across|among|upon)\\b`,
    "gi"
  )
}

/**
 * lexicalUnits に意味を積む
 *
 * 例:
 * phrase: "add to"
 * meaning.en: "increase something"
 * examples: [...]
 */
function pushLexicalUnitMeaning(
  map: Map<string, LexicalUnit>,
  phraseRaw: string,
  meaningEn: string,
  exampleSentence?: string
) {
  const phrase = normalizePattern(phraseRaw).toLowerCase()
  if (!phrase) return

  if (!map.has(phrase)) {
    map.set(phrase, {
      phrase,
      meanings: [],
    })
  }

  const unit = map.get(phrase)!
  const sentence = exampleSentence?.trim()

  const existing = unit.meanings.find((m) => m.meaning.en === meaningEn)

  if (existing) {
    if (!existing.examples?.length && sentence) {
      existing.examples = [
        {
          sentence,
          translation: "",
        },
      ]
    }
    return
  }

  unit.meanings.push({
    id: unit.meanings.length,
    meaning: {
      en: meaningEn,
      ja: "",
    },
    examples: sentence
      ? [
          {
            sentence,
            translation: "",
          },
        ]
      : [],
  })
}

/** top-level results から lexicalEntries を取る */
function getLexicalEntries(dictionary: any): any[] {
  const results = Array.isArray(dictionary?.results) ? dictionary.results : []

  return results.flatMap((r: any) => r?.lexicalEntries ?? [])
}

/**
 * sense と subsenses を再帰で全部並べる
 * これで sense / subsense の両方を同じように処理できる
 */
function flattenSenseTree(senses: any[]): any[] {
  const out: any[] = []

  function visit(sense: any) {
    out.push(sense)

    for (const sub of sense?.subsenses ?? []) {
      visit(sub)
    }
  }

  for (const sense of senses) {
    visit(sense)
  }

  return out
}

/** lexical entry 配下の senses / subsenses を全部取る */
function getAllSensesFromLexical(lexical: any): any[] {
  const rootSenses: any[] = (lexical?.entries ?? []).flatMap(
    (entry: any) => entry?.senses ?? []
  )

  return flattenSenseTree(rootSenses)
}

/** sense から最初の definition を取る */
function getFirstDefinition(sense: any): string {
  const definitions = uniqueStrings([
    ...(sense?.definitions ?? []),
    ...(sense?.shortDefinitions ?? []),
  ])

  return definitions[0] ?? ""
}

/** sense から最初の example を取る */
function getFirstExample(sense: any): string | undefined {
  const examples = uniqueStrings(
    (sense?.examples ?? []).map((ex: any) => ex?.text)
  )

  return examples[0]
}

/**
 * synonyms / antonyms は
 * sense / subsense の両方から拾う
 */
function collectRelationTexts(
  lexicalEntries: any[],
  key: "synonyms" | "antonyms"
): string[] {
  const values = lexicalEntries
    .flatMap((lexical) => getAllSensesFromLexical(lexical))
    .flatMap((sense: any) => sense?.[key] ?? [])
    .map((item: any) => item?.text)

  return uniqueStrings(values)
}

/**
 * Oxfordの lexicalCategory を UI のPOSキーに寄せる
 * normalizePOS が string[] を返す場合にも対応する
 */
function getPosList(lexical: any): string[] {
    const raw =
      normalizePOS(lexical?.lexicalCategory?.text) ??
      lexical?.lexicalCategory?.text
  
    const list = Array.isArray(raw) ? raw : [raw]
  
    return list
      .map((v) => (typeof v === "string" ? v : String(v)))
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }

/**
 * POSごとの senses を作る
 *
 * 出力:
 * {
 *   verb: [{ meaning, example, usage }],
 *   noun: [{ meaning, example, usage }]
 * }
 */
function buildGroupedSenses(lexicalEntries: any[]): Record<string, NormalizedSenseItem[]> {
  const grouped: Record<string, NormalizedSenseItem[]> = {}

  for (const lexical of lexicalEntries) {
    const posList = getPosList(lexical)
    const senses = getAllSensesFromLexical(lexical)

    for (const pos of posList) {
      if (!grouped[pos]) grouped[pos] = []

      for (const sense of senses) {
        const definition = getFirstDefinition(sense)
        if (!definition) continue

        grouped[pos].push({
          meaning: definition,
          example: getFirstExample(sense),
          usage: extractUsageFromSense(sense),
        })
      }
    }
  }

  return grouped
}

/**
 * 熟語 / 句動詞っぽい lexicalUnits を作る
 *
 * 取り方:
 * - constructions
 * - examples の regex hit
 * - notes.wordFormNote
 *
 * sense / subsense の両方を見る
 */
function buildLexicalUnits(
  lexicalEntries: any[],
  word: string
): LexicalUnit[] {
  const lexicalUnitMap = new Map<string, LexicalUnit>()
  const target = (word ?? "").trim().toLowerCase()
  const regex = buildPatternRegex(target)

  for (const lexical of lexicalEntries) {
    const senses = getAllSensesFromLexical(lexical)

    for (const sense of senses) {
      const definition = getFirstDefinition(sense)
      if (!definition) continue

      for (const c of sense?.constructions ?? []) {
        if (typeof c?.text === "string") {
          pushLexicalUnitMeaning(
            lexicalUnitMap,
            c.text,
            definition,
            getFirstExample(sense)
          )
        }
      }

      for (const ex of sense?.examples ?? []) {
        const text = ex?.text
        if (!text) continue

        const matches = text.match(regex)
        if (!matches) continue

        for (const phraseRaw of matches) {
          pushLexicalUnitMeaning(
            lexicalUnitMap,
            phraseRaw,
            definition,
            text
          )
        }
      }

      for (const note of sense?.notes ?? []) {
        if (note?.type === "wordFormNote" && typeof note?.text === "string") {
          pushLexicalUnitMeaning(
            lexicalUnitMap,
            note.text,
            definition,
            getFirstExample(sense)
          )
        }
      }
    }
  }

  return Array.from(lexicalUnitMap.values())
}

/** top-level inflections を UI用に整える */
function getInflections(dictionary: any): string[] {
  return Array.isArray(dictionary?.inflections)
    ? uniqueStrings(dictionary.inflections)
    : []
}

/** top-level derivatives を UI用に整える */
function getDerivatives(dictionary: any): string[] {
  return Array.isArray(dictionary?.derivatives)
    ? uniqueStrings(dictionary.derivatives)
    : []
}

/**
 * etymology は
 * 1. top-level にあればそれを優先
 * 2. なければ Oxford entries から最初の1件を取る
 */
function getEtymology(dictionary: any, lexicalEntries: any[]): string {
  if (typeof dictionary?.etymology === "string" && dictionary.etymology.trim()) {
    return dictionary.etymology.trim()
  }

  return (
    lexicalEntries
      .flatMap((le: any) => le?.entries ?? [])
      .flatMap((entry: any) => entry?.etymologies ?? [])
      .find((v: any) => typeof v === "string" && v.trim().length > 0)
      ?.trim() ?? ""
  )
}

/**
 * Oxford辞書データを RootLink UI 用に正規化する
 */
export function normalizeDictionary(
  dictionary: any,
  word: string
): NormalizedDictionary {
  const lexicalEntries = getLexicalEntries(dictionary)

  const inflections = getInflections(dictionary)
  const derivatives = getDerivatives(dictionary)
  const synonyms = collectRelationTexts(lexicalEntries, "synonyms")
  const antonyms = collectRelationTexts(lexicalEntries, "antonyms")
  const senses = buildGroupedSenses(lexicalEntries)
  const lexicalUnits = buildLexicalUnits(lexicalEntries, word)
  const etymology = getEtymology(dictionary, lexicalEntries)

  return {
    inflections,
    synonyms,
    antonyms,
    derivatives,
    senses,
    lexicalUnits,
    etymology,
  }
}