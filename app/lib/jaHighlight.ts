// 日本語訳のハイライト候補抽出。QuizSession / /phrases 検証で共有。
// meaning_ja から example_ja に出現する候補 (漢字塊・カタカナ・ひらがなオノマトペ・活用語幹) を返す。

const STOP = new Set([
  'している','された','されて','になる','という','ように','ことは','ことに','ことを','なった','なって','います','ました','ません',
])

function trimOkurigana(s: string): string {
  return s.replace(
    /(?:している|していない|されている|されていない|られている|られていない|ている|ていた|ていない|ました|ません|ます|だった|です|なきゃ|まま|だ|た|て|る|ない)+$/u,
    '',
  )
}

/** meaning_ja に対して ja に含まれる候補のリストを長さ降順で返す */
export function jaHighlightMatches(meaning: string, ja: string): string[] {
  if (!meaning) return []
  const base = meaning.split(/[のをにはがでともやへ、。・〜…\s（）「」？！]+/).filter(s => s.length >= 2)
  const kanjiChunks = meaning.match(/\p{Script=Han}{2,}/gu) ?? []
  const katakanaChunks = meaning.match(/[゠-ヿー]{3,}/gu) ?? []
  const hiraganaChunks = meaning.match(/[぀-ゟー]{3,}/gu) ?? []
  const singleKanji = meaning.match(/\p{Script=Han}/gu) ?? []
  const stems = base.map(trimOkurigana).filter(s => s.length >= 1)

  const candidates = Array.from(new Set([
    ...base, ...stems, ...kanjiChunks, ...katakanaChunks, ...hiraganaChunks, ...singleKanji,
  ]))
    .filter(c => {
      if (STOP.has(c)) return false
      if (c.length === 1 && /\p{Script=Han}/u.test(c)) return true
      if (c.length >= 2 && /\p{Script=Han}/u.test(c)) return true
      if (c.length >= 3 && /^[゠-ヿー]+$/u.test(c)) return true
      if (c.length >= 3 && /^[぀-ゟー]+$/u.test(c)) return true
      return false
    })
    .sort((a, b) => b.length - a.length)

  return candidates.filter(c => ja.includes(c))
}
