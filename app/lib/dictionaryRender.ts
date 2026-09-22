import type { SavedWordDictionary, SavedWordSenseGroup } from '@/types/Dictionary'
import type { DisplayLocale } from '@/types/DisplayLocale'

export type DeckWordOverride = {
  pinnedSenseId: string | null
  meaning: string | null
  example: string | null
  exampleTranslation: string | null
}

/**
 * deck_words の meaning / example / example_translation / pinned_sense_id を
 * 共有 dictionary_cache には触れずに、この 1 エントリ用のペイロードに焼き込む。
 * pinned_sense_id が null のときは senseGroups の先頭 sense に上書きする。
 * text がすべて空なら元をそのまま返す (dictionary_cache そのものを渡す)。
 */
export function applyDeckOverridesToDictionary(
  dictionary: SavedWordDictionary | null,
  override: DeckWordOverride,
): SavedWordDictionary | null {
  if (!dictionary) return dictionary
  const meaning = override.meaning?.trim() || null
  const example = override.example?.trim() || null
  const exampleTranslation = override.exampleTranslation?.trim() || null
  if (!meaning && !example && !exampleTranslation) return dictionary

  let targetSenseId = override.pinnedSenseId
  if (!targetSenseId) {
    for (const g of dictionary.senseGroups ?? []) {
      const first = (g.senses ?? [])[0]
      if (first?.senseId) { targetSenseId = String(first.senseId); break }
    }
  }
  if (!targetSenseId) return dictionary

  const cloned: SavedWordDictionary = {
    ...dictionary,
    senseGroups: (dictionary.senseGroups ?? []).map(g => ({
      ...g,
      senses: (g.senses ?? []).map(s => {
        if (String(s.senseId ?? '') !== targetSenseId) return s
        return example ? { ...s, example } : s
      }),
    })),
  }
  if (meaning || exampleTranslation) {
    const jaSenses = cloned.locales?.ja?.senses ?? {}
    const prev = jaSenses[targetSenseId] ?? {}
    cloned.locales = {
      ...(cloned.locales ?? {}),
      ja: {
        ...(cloned.locales?.ja ?? {}),
        senses: {
          ...jaSenses,
          [targetSenseId]: {
            ...prev,
            ...(meaning ? { meaning } : {}),
            ...(exampleTranslation ? { exampleTranslation } : {}),
          },
        },
      },
    }
  }
  return cloned
}

export type DisplaySense = {
  senseId: string
  meaning: string
  example?: string
  exampleTranslation?: string
}

export type Pronunciation = {
  phoneticSpelling?: string
  audioFile?: string
}

export function buildPronunciation(dictionary: SavedWordDictionary | null | undefined): Pronunciation {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (dictionary?.audio?.audioUrl) {
    return {
      phoneticSpelling: dictionary.ipa ?? undefined,
      audioFile: dictionary.audio.audioUrl,
    }
  }
  if (dictionary?.audio?.audioPath) {
    return {
      phoneticSpelling: dictionary.ipa ?? undefined,
      audioFile: `${supabaseUrl}/storage/v1/object/public/${dictionary.audio.audioPath}`,
    }
  }
  return {
    phoneticSpelling: dictionary?.ipa ?? undefined,
    audioFile: undefined,
  }
}

export function buildSenses(
  dictionary: SavedWordDictionary | null | undefined,
  locale: DisplayLocale = 'ja',
): Record<string, DisplaySense[]> {
  const senseGroups: SavedWordSenseGroup[] = dictionary?.senseGroups ?? []
  const jaLocales = dictionary?.locales?.ja?.senses ?? {}
  const result: Record<string, DisplaySense[]> = {}

  for (const group of senseGroups) {
    const pos = String(group.partOfSpeech ?? '').toLowerCase()
    if (!pos) continue
    const rawSenses: DisplaySense[] = (group.senses ?? [])
      .map((sense) => {
        const senseId = String(sense.senseId ?? '')
        const ja = jaLocales[senseId]
        const meaning = locale === 'ja'
          ? (ja?.meaning ?? sense.definition ?? '')
          : (sense.definition ?? ja?.meaning ?? '')
        return { senseId, meaning, example: sense.example ?? undefined, exampleTranslation: ja?.exampleTranslation ?? undefined }
      })
      .filter((s) => s.senseId && s.meaning)
    const seenMeaning = new Set<string>()
    const senses: DisplaySense[] = []
    for (const s of rawSenses) {
      const key = s.meaning.trim()
      if (seenMeaning.has(key)) continue
      seenMeaning.add(key)
      senses.push(s)
    }
    if (senses.length > 0) result[pos] = senses
  }
  return result
}
