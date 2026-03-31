'use client'

// sense ごとの文法タグ表示担当
// grammatical note の日英切り替えとタグ見た目をこのコンポーネントに閉じ込める

type DisplayLocale = 'en' | 'ja'

type Props = {
  tags: string[]
  displayLocale: DisplayLocale
}

// Oxford の grammatical note を日本語表示に寄せる
const GRAMMAR_TAG_LABELS_JA: Record<string, string> = {
  'no object': '自動詞',
  'with object': '他動詞',
  'with adverbial': '副詞句を伴う',
  'with complement': '補語を伴う',
  'with infinitive': '不定詞を伴う',
  'with clause': '節を伴う',
  'mass noun': '不可算名詞',
  'count noun': '可算名詞',
  'usually with modifier': '通常は修飾語を伴う',
  'usually as adjective': '通常は形容詞として用いる',
  'usually as adverb': '通常は副詞として用いる',
  'usually as noun': '通常は名詞として用いる',
  'usually as verb': '通常は動詞として用いる',
}

// tag の表記ゆれを吸収
function normalizeGrammarTag(tag: string): string {
  return tag.trim().toLowerCase()
}

// locale に応じて表示文言を決定
function getDisplayedGrammarTag(
  tag: string,
  displayLocale: DisplayLocale
): string {
  if (displayLocale === 'en') {
    return tag
  }

  const normalizedTag = normalizeGrammarTag(tag)
  return GRAMMAR_TAG_LABELS_JA[normalizedTag] ?? tag
}

export default function GrammarTags({ tags, displayLocale }: Props) {
  // 重複と空文字を落とす
  const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]

  if (normalizedTags.length === 0) {
    return null
  }

  return (
    <>
      {normalizedTags.map((tag) => (
        <span
          key={tag}
          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
        >
          {getDisplayedGrammarTag(tag, displayLocale)}
        </span>
      ))}
    </>
  )
}