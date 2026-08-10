import type { SavedWordDictionary } from '@/types/Dictionary'

const HASHTAG = '#RootLink'
const MEANING_MAX = 60

function truncateTail(text: string, max: number): string {
  const t = text.trim()
  return t.length <= max ? t : t.slice(0, max - 1) + '…'
}

function extractMeaning(
  dictionary: SavedWordDictionary | null | undefined,
  pinnedSenseId?: string | null
): string | null {
  if (!dictionary) return null
  const allSenses = (dictionary.senseGroups ?? []).flatMap((g) => g.senses ?? [])
  const target =
    (pinnedSenseId && allSenses.find((s) => s.senseId === pinnedSenseId)) ||
    allSenses[0]
  if (!target) return null
  const senseId = target.senseId ?? ''
  const jaMeaning = dictionary.locales?.ja?.senses?.[senseId]?.meaning
  return (jaMeaning ?? target.definition ?? null)?.trim() || null
}

/**
 * SNS シェア用プリセット本文。
 *   word
 *   意味(末尾…truncate)
 *
 *   #RootLink
 */
export function buildShareText(
  word: string,
  dictionary: SavedWordDictionary | null | undefined,
  pinnedSenseId?: string | null
): string {
  const meaning = extractMeaning(dictionary, pinnedSenseId)
  const meaningLine = meaning ? truncateTail(meaning, MEANING_MAX) : ''
  return meaningLine
    ? `${word}\n${meaningLine}\n\n${HASHTAG}`
    : `${word}\n\n${HASHTAG}`
}
