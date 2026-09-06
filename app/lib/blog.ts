export type Post = {
  id: string
  title: string
  slug: string
  content: string
  tags: string[] | null
  published_at: string | null
  created_at: string
  hero_image_url: string | null
  meta_description: string | null
}

export type Heading = { id: string; level: number; text: string }

// 記事本文の Markdown から h1〜h3 を抽出して、目次リンク用の id を付与する
export function extractHeadings(markdown: string): Heading[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  const headings: Heading[] = []
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ぁ-んァ-ヶ一-龠]/g, '')
    headings.push({ level: match[1].length, text, id })
  }
  return headings
}

// 本文中の `<phrase-card id="uuid" />` から phrase_card ID を全部抜き出す
export function extractPhraseCardIds(markdown: string): string[] {
  const re = /<phrase-card\s+id=["']([^"']+)["']\s*\/?>/gi
  const ids = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    ids.add(m[1])
  }
  return Array.from(ids)
}

export type WordCardEntry = { word: string; senseIndex?: number }

// 本文中の `<word-card word="historic" sense="2" />` を抜き出す。
// sense 属性は 1-based の序数。省略時は先頭 sense にフォールバック。
export function extractWordCardEntries(markdown: string): WordCardEntry[] {
  const re = /<word-card\s+([^/>]+?)\s*\/?>/gi
  const out: WordCardEntry[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    const attrs = m[1]
    const wordMatch = /word=["']([^"']+)["']/i.exec(attrs)
    if (!wordMatch) continue
    const word = wordMatch[1].trim().toLowerCase()
    if (!word) continue
    const senseMatch = /sense=["']([^"']+)["']/i.exec(attrs)
    const senseIndex = senseMatch ? Number.parseInt(senseMatch[1], 10) : undefined
    const senseFinal = senseIndex && Number.isFinite(senseIndex) && senseIndex >= 1 ? senseIndex : undefined
    const key = `${word}::${senseFinal ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ word, senseIndex: senseFinal })
  }
  return out
}

// unique な word だけを取り出す（DB fetch 用）
export function extractWordCardWords(markdown: string): string[] {
  return Array.from(new Set(extractWordCardEntries(markdown).map((e) => e.word)))
}
