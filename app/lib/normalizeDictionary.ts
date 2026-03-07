/**
 * normalizeDictionary
 *
 * Oxford API の複雑な JSON を
 * RootLink UI 用のシンプルな構造に変換する関数。
 *
 * 役割
 * - inflections（活用形）
 * - synonyms / antonyms
 * - senses（品詞ごとの意味）
 * - patterns（構文）
 * - etymology（語源）
 *
 * を Oxford JSON から抽出してまとめる。
 *
 * 目的
 * - UIコンポーネントをシンプルに保つ
 * - Oxford JSON 解析を1箇所に集約する
 */

// lib/normalizeDictionary.ts
import { normalizePOS } from "@/lib/pos"

export type NormalizedSenseItem = {
    meaning: string
    example?: string
    }

    export type NormalizedDictionary = {
    inflections: string[]
    synonyms: string[]
    antonyms: string[]
    senses: Record<string, NormalizedSenseItem[]>
    patterns: string[]
    etymology: string
    }

    export function normalizeDictionary(dictionary: any, word: string): NormalizedDictionary {
    const results = dictionary?.results ?? []
    const lexicalEntries = results.flatMap((r: any) => r.lexicalEntries ?? [])

    // inflections: resolveQuery で dictionary.inflections に入れている前提（なければ空）
    const inflections: string[] = Array.isArray(dictionary?.inflections) ? dictionary.inflections : []

    // synonyms / antonyms
    const synonyms: string[] =
        lexicalEntries
        .flatMap((le: any) => le.entries ?? [])
        .flatMap((entry: any) => entry.senses ?? [])
        .flatMap((sense: any) => sense.synonyms ?? [])
        .map((s: any) => s?.text)
        .filter((v: any): v is string => typeof v === "string" && v.length > 0)

    const antonyms: string[] =
        lexicalEntries
        .flatMap((le: any) => le.entries ?? [])
        .flatMap((entry: any) => entry.senses ?? [])
        .flatMap((sense: any) => sense.antonyms ?? [])
        .map((s: any) => s?.text)
        .filter((v: any): v is string => typeof v === "string" && v.length > 0)

    // senses（品詞ごと）
    const grouped: Record<string, NormalizedSenseItem[]> = {}

    for (const lexical of lexicalEntries) {
        const posRaw = normalizePOS(lexical.lexicalCategory?.text) ?? lexical.lexicalCategory?.text
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
                example: sense.examples?.[0]?.text ?? "",
            })

            for (const sub of sense.subsenses ?? []) {
                const subDef = sub.definitions?.[0]
                if (!subDef) continue

                grouped[pos].push({
                meaning: subDef,
                example: sub.examples?.[0]?.text ?? "",
                })
            }
            }
        }
        }
    }

    // patterns
    const set = new Set<string>()
    const target = (word ?? "").toLowerCase()

    for (const lexical of lexicalEntries) {
        for (const entry of lexical.entries ?? []) {
        for (const sense of entry.senses ?? []) {
            sense.constructions?.forEach((c: any) => {
            if (c?.text) set.add(c.text)
            })

            sense.notes?.forEach((note: any) => {
            if (note?.type === "wordFormNote" && note?.text) set.add(note.text)
            })

            sense.examples?.forEach((ex: any) => {
            if (!ex?.text) return
            const text = ex.text.toLowerCase()

            const regex = new RegExp(
                `\\b${target}\\s+(with|to|on|about|for|of|in|at|from)\\b`,
                "g"
            )

            const matches = text.match(regex)
            if (matches) matches.forEach((m: string) => set.add(m))
            })
        }
        }
    }

    const patterns = Array.from(set)

    // etymology
    const etymology =
        lexicalEntries
        .flatMap((le: any) => le.entries ?? [])
        .flatMap((e: any) => e.etymologies ?? [])
        ?.[0] ?? ""

    return {
        inflections,
        synonyms: [...new Set(synonyms)],
        antonyms: [...new Set(antonyms)],
        senses: grouped,
        patterns,
        etymology,
    }
}