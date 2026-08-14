export function stripPhraseParens(phrase: string): string {
  return phrase.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

// 学習者向け表示用: 辞書 slot (sth/sb/one's) を ~ に置換
export function displayPhrase(phrase: string): string {
  return stripPhraseParens(phrase)
    .replace(/\bone's\b/gi, '~')
    .replace(/\bsth\b/gi, '~')
    .replace(/\bsb\b/gi, '~')
}
