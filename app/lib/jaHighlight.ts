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

// 五段活用動詞の終止形末尾 (「手を引く」「水を飲む」等) を落として語幹を作る。
// trimOkurigana とは別経路: 文節 (「手を引く」) をそのまま保ちつつ、
// 「手を引」も候補に入れたいときだけ使う。
function trimTerminalVerb(s: string): string {
  // 末尾の 1 かな (う/く/ぐ/す/つ/ぬ/ぶ/む/る) を落とす。
  // 「〜する」の「する」も落とす (「撤退する」→「撤退」)。
  // ただし「〜る」は trimOkurigana で既に落ちているので重複は無害。
  if (/する$/u.test(s)) return s.slice(0, -2)
  if (/[うくぐすつぬぶむる]$/u.test(s)) return s.slice(0, -1)
  return s
}

// 動詞/形容詞の活用末尾として「立つ」「使える」のような <kanji>+<kana> 片を候補に加える。
// 「役に立つ」の meaning_ja は句点で割れずそのまま入ってくるので base/stems では捕まらない。
// 助詞 (に/を/は/が/で/と/も/や/へ/の) で始まる kana 片は除外して誤マッチを避ける。
const PARTICLES = new Set(['の','を','に','は','が','で','と','も','や','へ'])
function kanjiKanaChunks(meaning: string): string[] {
  const out: string[] = []
  for (let i = 0; i < meaning.length; i++) {
    if (!/\p{Script=Han}/u.test(meaning[i])) continue
    // この kanji から先に続く kanji をまとめる
    let j = i + 1
    while (j < meaning.length && /\p{Script=Han}/u.test(meaning[j])) j++
    const kanji = meaning.slice(i, j)
    // 続く kana を 1〜3 文字拾う (助詞始まりは除外)
    const first = meaning[j]
    if (!first || !/[ぁ-ゟー]/.test(first) || PARTICLES.has(first)) { i = j - 1; continue }
    out.push(kanji + first)
    const second = meaning[j + 1]
    if (second && /[ぁ-ゟー]/.test(second)) out.push(kanji + first + second)
    const third = meaning[j + 2]
    if (second && third && /[ぁ-ゟー]/.test(third)) out.push(kanji + first + second + third)
    i = j - 1
  }
  return out
}

/** meaning_ja に対して ja に含まれる候補のリストを長さ降順で返す */
export function jaHighlightMatches(meaning: string, ja: string): string[] {
  if (!meaning) return []
  const base = meaning.split(/[のをにはがでともやへ、。・〜…\s（）「」？！]+/).filter(s => s.length >= 2)
  // 句読点だけで split した「文節」。助詞を含むフレーズ (「手を引く」「気を遣う」) を
  // 1 つの候補として残す。活用末尾を trim した stem (「手を引」) も入れて
  // example_ja の活用形「手を引きました」等に先頭一致させる。
  const clauseChunks = meaning
    .split(/[、。・〜…\s（）「」？！]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && /\p{Script=Han}/u.test(s))
  // 文節の活用末尾を 2 段階で削る: 「手を引く」→「手を引」(終止形 く を落とす) /
  // 「撤退する」→「撤退」(する を落とす) → example の「手を引きました」「撤退した」に先頭一致
  const clauseStems = clauseChunks
    .flatMap(c => [trimOkurigana(c), trimTerminalVerb(trimOkurigana(c))])
    .filter(s => s.length >= 2)
  const kanjiChunks = meaning.match(/\p{Script=Han}{2,}/gu) ?? []
  const katakanaChunks = meaning.match(/[゠-ヿー]{3,}/gu) ?? []
  const hiraganaChunks = meaning.match(/[぀-ゟー]{3,}/gu) ?? []
  const singleKanji = meaning.match(/\p{Script=Han}/gu) ?? []
  const stems = base.map(trimOkurigana).filter(s => s.length >= 1)
  const verbSpans = kanjiKanaChunks(meaning)

  const candidates = Array.from(new Set([
    // 長い塊 (文節) を先に入れて、長さ降順ソート後に優先マッチさせる
    ...clauseChunks, ...clauseStems,
    ...base, ...stems, ...kanjiChunks, ...katakanaChunks, ...hiraganaChunks, ...verbSpans, ...singleKanji,
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
