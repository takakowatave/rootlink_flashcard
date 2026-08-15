export function stripPhraseParens(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

// 学習者向け表示用: 辞書 slot (sth/sb/one's) を ~ (単一) / A・B・C... (複数) に置換
export function displayPhrase(phrase: string): string {
  const stripped = stripPhraseParens(phrase)
  const slotRegex = /\b(?:one's|sth|sb)\b/gi
  const matchCount = (stripped.match(slotRegex) ?? []).length
  if (matchCount <= 1) return stripped.replace(slotRegex, '~')
  const labels = ['A', 'B', 'C', 'D']
  let i = 0
  return stripped.replace(slotRegex, () => labels[i++] ?? '~')
}
