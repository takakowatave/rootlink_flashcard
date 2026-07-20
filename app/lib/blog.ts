export type Post = {
  id: string
  title: string
  slug: string
  content: string
  tags: string[] | null
  published_at: string | null
  created_at: string
  hero_image_url: string | null
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
