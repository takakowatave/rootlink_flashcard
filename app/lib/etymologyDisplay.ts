import type { LocalizedEtymologyJa } from '@/types/Etymology'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// dictionary_cache payload の locales.ja.etymology を読む
export function readLocalizedEtymologyJa(value: unknown): LocalizedEtymologyJa | null {
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

  return { originLanguageLabel, description, sourceMeaning, hook }
}

// パーツで語源が伝わる場合の冗長な説明文を弾く
export function isRedundantEtymologyDescription(text: string): boolean {
  const trimmed = text.trim()
  return (
    /から来てい(ます|る)[。．]?\s*$/.test(trimmed) ||
    /^.{0,30}から来てい(ます|る)[。．]?\s*$/.test(trimmed)
  )
}
