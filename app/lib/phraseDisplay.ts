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

// 例文の強調用に、phrase から目的語スロット（someone / something / one's など）を外した形を返す
// 例: 'could do with something' -> 'could do with'。スロットが途中にある場合は先頭側だけを返す
const SLOT_WORDS = new Set(['someone', "someone's", 'something', "one's", 'oneself', 'sb', 'sth', 'doing'])
export function phraseHighlightTerm(phrase: string): string {
  const words = stripPhraseParens(phrase).split(/\s+/).filter(Boolean)
  const cut = words.findIndex(w => SLOT_WORDS.has(w.toLowerCase()))
  const head = cut < 0 ? words : words.slice(0, cut)
  return head.join(' ')
}

// 例文の強調用に、phrase をスロット語（someone / somebody / something / one's / sb / sth / doing / oneself）
// で分割した非スロット部分の配列を返す。クイズ / フレーズ詳細 / 検品ツールで共用する。
// 例: "can't stress something enough" -> ["can't stress", "enough"]
// 例: "take one's time"               -> ["take", "time"]
// 例: "put on"                        -> ["put on"]
// 例文側でスロット語が別の節に置き換わっていても、残った部分がそれぞれ個別に強調される。
const SLOT_PATTERN = /\b(?:someone(?:'s)?|somebody(?:'s)?|something|one's|oneself|sb(?:'s)?|sth|doing)\b/gi
export function phraseHighlightTerms(phrase: string): string[] {
  const stripped = stripPhraseParens(phrase)
  return stripped
    .split(SLOT_PATTERN)
    .map(s => s.trim())
    .filter(Boolean)
}

// 例文の中で phrase を 1 つの連続スパンとして強調するための正規表現 (本体のみ)。
// 「more than one's job's worth」の例文「more than my job's worth」のように slot 部分に
// 具体名詞が入っていても、全体 (my 含む) を途切れずハイライトする。slot 位置は
// 文末記号 (.?!) を跨がない 1〜3 語の filler にマッチする。
// 戻り値は RegExp のソース文字列 (呼び出し側で g/i フラグを付与)。
export function buildPhraseSpanRegex(phrase: string): string {
  const stripped = stripPhraseParens(phrase)
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = stripped.split(SLOT_PATTERN).map(p => p.trim()).filter(Boolean).map(escape)
  if (parts.length === 0) return '(?!)'
  // slot 位置の filler: 1〜3 語の word (apostrophe / ハイフン含む) を許容
  const FILLER = "[\\w'\\-]+(?:\\s+[\\w'\\-]+){0,2}"
  return `\\b${parts.join(`\\s+${FILLER}\\s+`)}\\b`
}
