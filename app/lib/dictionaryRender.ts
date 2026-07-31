import type { SavedWordDictionary, SavedWordSenseGroup } from '@/types/Dictionary'
import type { DisplayLocale } from '@/types/DisplayLocale'

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
    const senses: DisplaySense[] = (group.senses ?? [])
      .map((sense) => {
        const senseId = String(sense.senseId ?? '')
        const ja = jaLocales[senseId]
        const meaning = locale === 'ja'
          ? (ja?.meaning ?? sense.definition ?? '')
          : (sense.definition ?? ja?.meaning ?? '')
        return { senseId, meaning, example: sense.example ?? undefined, exampleTranslation: ja?.exampleTranslation ?? undefined }
      })
      .filter((s) => s.senseId && s.meaning)
    if (senses.length > 0) result[pos] = senses
  }
  return result
}
