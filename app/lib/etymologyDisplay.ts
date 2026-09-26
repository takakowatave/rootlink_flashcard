import type { LocalizedEtymologyJa } from '@/types/Etymology'
import type { DisplayLocale } from '@/types/DisplayLocale'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * dictionary_cache payload の locales.{locale}.etymology を読む。
 * locale='en' や locales key が無い場合は null を返す (呼び出し側で英語原文にフォールバックする)。
 * DB には現状 locales.ja しか入っていないが、locale 引数を受け取る形にして
 * 将来の en/その他 locale 追加にも耐えられるようにする。
 */
export function readLocalizedEtymology(
  value: unknown,
  locale: DisplayLocale,
): LocalizedEtymologyJa | null {
  if (locale !== 'ja') return null
  if (!isRecord(value)) return null

  const locales = isRecord(value.locales) ? value.locales : null
  const localeBlock = locales && isRecord(locales[locale]) ? (locales[locale] as Record<string, unknown>) : null
  const etymology =
    localeBlock && isRecord(localeBlock.etymology) ? localeBlock.etymology : null

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

// 後方互換: 既存呼び出し側 (WordPageClient / EtymologyBlock 経由) はこちらを使い続けられる。
export function readLocalizedEtymologyJa(value: unknown): LocalizedEtymologyJa | null {
  return readLocalizedEtymology(value, 'ja')
}

// パーツで語源が伝わる場合の冗長な説明文を弾く
export function isRedundantEtymologyDescription(text: string): boolean {
  const trimmed = text.trim()
  return (
    /から来てい(ます|る)[。．]?\s*$/.test(trimmed) ||
    /^.{0,30}から来てい(ます|る)[。．]?\s*$/.test(trimmed)
  )
}
