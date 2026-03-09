/**
 * normalizeDictionary
 *
 * Oxford API JSON → RootLink UI 用データ
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

function normalizeUsageLabel(text: string): string | null {
  if (!text) return null

  const t = text.trim().toLowerCase()

  if (t === "mass noun") return null
  if (t === "count noun") return null

  return text.trim()
}

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

function normalizePattern(text: string): string {
  return text
    .replace(/"/g, "")
    .replace(/,.*$/, "")
    .replace(/^usually\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

function buildPatternRegex(target: string): RegExp {
  return new RegExp(
    `\\b${target}\\s+(with|to|on|about|for|of|in|at|from|that|into|over|under|around|through|after|against|between|by|across|among|upon)\\b`,
    "gi"
  )
}

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
  
    const existing = unit.meanings.find(
      (m) => m.meaning.en === meaningEn
    )
  
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

export function normalizeDictionary(
  dictionary: any,
  word: string
): NormalizedDictionary {
  const results = dictionary?.results ?? []
  console.log("NORMALIZE INPUT RAW DERIVATIVES", dictionary?.derivatives)
  const lexicalEntries = results.flatMap((r: any) => r.lexicalEntries ?? [])

  const inflections: string[] =
    Array.isArray(dictionary?.inflections) ? dictionary.inflections : []

  const synonyms: string[] = lexicalEntries
    .flatMap((le: any) => le.entries ?? [])
    .flatMap((entry: any) => entry.senses ?? [])
    .flatMap((sense: any) => sense.synonyms ?? [])
    .map((s: any) => s?.text)
    .filter((v: any): v is string => typeof v === "string" && v.length > 0)

    const derivatives: string[] =
    Array.isArray(dictionary?.derivatives)
      ? dictionary.derivatives.filter(
          (v: unknown): v is string =>
            typeof v === "string" && v.trim().length > 0
        )
      : []

  const antonyms: string[] = lexicalEntries
    .flatMap((le: any) => le.entries ?? [])
    .flatMap((entry: any) => entry.senses ?? [])
    .flatMap((sense: any) => sense.antonyms ?? [])
    .map((s: any) => s?.text)
    .filter((v: any): v is string => typeof v === "string" && v.length > 0)

  const grouped: Record<string, NormalizedSenseItem[]> = {}

  for (const lexical of lexicalEntries) {
    const posRaw =
      normalizePOS(lexical.lexicalCategory?.text) ??
      lexical.lexicalCategory?.text

    const posList = Array.isArray(posRaw) ? posRaw : [posRaw]

    for (const pos of posList) {
      if (!pos) continue
      if (!grouped[pos]) grouped[pos] = []

      for (const entry of lexical.entries ?? []) {
        for (const sense of entry.senses ?? []) {
          const definition = sense.definitions?.[0]
          if (!definition) continue

          grouped[pos].push({
            meaning: definition,
            example: sense.examples?.[0]?.text,
            usage: extractUsageFromSense(sense),
          })

          for (const sub of sense.subsenses ?? []) {
            const subDef = sub.definitions?.[0]
            if (!subDef) continue

            grouped[pos].push({
              meaning: subDef,
              example: sub.examples?.[0]?.text,
              usage: extractUsageFromSense(sub),
            })
          }
        }
      }
    }
  }

  const lexicalUnitMap = new Map<string, LexicalUnit>()
  const target = (word ?? "").trim().toLowerCase()
  const regex = buildPatternRegex(target)

  for (const lexical of lexicalEntries) {
    for (const entry of lexical.entries ?? []) {
      for (const sense of entry.senses ?? []) {
        const def = sense.definitions?.[0] ?? ""

        for (const c of sense.constructions ?? []) {
          if (typeof c?.text === "string") {
            pushLexicalUnitMeaning(
              lexicalUnitMap,
              c.text,
              def,
              sense.examples?.[0]?.text
            )
          }
        }

        for (const ex of sense.examples ?? []) {
          const text = ex?.text
          if (!text) continue

          const matches = text.match(regex)
          if (!matches) continue

          for (const phraseRaw of matches) {
            pushLexicalUnitMeaning(
              lexicalUnitMap,
              phraseRaw,
              def,
              text
            )
          }
        }

        for (const note of sense?.notes ?? []) {
          if (note?.type === "wordFormNote" && typeof note?.text === "string") {
            pushLexicalUnitMeaning(
              lexicalUnitMap,
              note.text,
              def,
              sense.examples?.[0]?.text
            )
          }
        }

        for (const sub of sense.subsenses ?? []) {
          const subDef = sub.definitions?.[0] ?? ""

          for (const c of sub.constructions ?? []) {
            if (typeof c?.text === "string") {
              pushLexicalUnitMeaning(
                lexicalUnitMap,
                c.text,
                subDef,
                sub.examples?.[0]?.text
              )
            }
          }

          for (const ex of sub.examples ?? []) {
            const text = ex?.text
            if (!text) continue

            const matches = text.match(regex)
            if (!matches) continue

            for (const phraseRaw of matches) {
              pushLexicalUnitMeaning(
                lexicalUnitMap,
                phraseRaw,
                subDef,
                text
              )
            }
          }

          for (const note of sub?.notes ?? []) {
            if (note?.type === "wordFormNote" && typeof note?.text === "string") {
              pushLexicalUnitMeaning(
                lexicalUnitMap,
                note.text,
                subDef,
                sub.examples?.[0]?.text
              )
            }
          }
        }
      }
    }
  }

    const lexicalUnits: LexicalUnit[] = Array.from(lexicalUnitMap.values())

    const etymology =
    lexicalEntries
        .flatMap((le: any) => le.entries ?? [])
        .flatMap((e: any) => e.etymologies ?? [])
        ?.[0] ?? ""

    console.log("NORMALIZE INPUT DERIVATIVES", dictionary?.derivatives)
    console.log("NORMALIZE OUTPUT DERIVATIVES", derivatives)
  return {
    inflections,
    synonyms: [...new Set(synonyms)],
    antonyms: [...new Set(antonyms)],
    derivatives: [...new Set(derivatives)],
    senses: grouped,
    lexicalUnits,
    etymology,
  }
}