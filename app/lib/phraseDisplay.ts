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
// 以下の実データバリエーションに追従する (全 927 件検証で 99.4% カバー):
//   - slot filler: 「more than my job's worth」(my) を間に挟んでも途切れずマッチ
//   - be の活用: 「be opposed to」→「are opposed to / was opposed to / 'm not opposed to」
//   - 動詞の活用: 「get worse」→「getting worse」/「keep」→「kept」
//   - 不規則動詞 50 語超: come/came, go/went, find/found, break/broke, keep/kept 等
//   - 冠詞揺らぎ: 「a piece」→「one piece」, 「a round」→「a second round」
//   - 代名詞揺らぎ: 「your head」→「his head」
//   - 名詞複数: 「ray」→「rays」/「surgery」→「surgeries」
//   - 分離型句動詞: 「look up」が「look it up」でも、スロット省略「look up」でもマッチ
//   - 末尾の "do" プレースホルダ: 「agree to do」→「agreed to help」(「do」は無視)
// 戻り値は RegExp のソース文字列 (呼び出し側で g/i フラグを付与)。
const IRREGULAR_VERBS: Record<string, string[]> = {
  be:['am','is','are','was','were','been','being',"'m","'re","'s"],
  break:['broke','broken','breaks','breaking'],bring:['brought','brings','bringing'],buy:['bought','buys','buying'],
  come:['came','comes','coming'],do:['did','done','does','doing'],draw:['drew','drawn','draws','drawing'],
  drive:['drove','driven','drives','driving'],eat:['ate','eaten','eats','eating'],fall:['fell','fallen','falls','falling'],
  feel:['felt','feels','feeling'],find:['found','finds','finding'],forget:['forgot','forgotten','forgets','forgetting'],
  get:['got','gotten','gets','getting'],give:['gave','given','gives','giving'],go:['went','gone','goes','going'],
  have:['had','has','having',"'ve","'d"],hold:['held','holds','holding'],keep:['kept','keeps','keeping'],
  know:['knew','known','knows','knowing'],leave:['left','leaves','leaving'],let:['lets','letting'],
  lose:['lost','loses','losing'],make:['made','makes','making'],mean:['meant','means','meaning'],
  meet:['met','meets','meeting'],pay:['paid','pays','paying'],put:['puts','putting'],read:['reads','reading'],
  run:['ran','runs','running'],say:['said','says','saying'],see:['saw','seen','sees','seeing'],
  send:['sent','sends','sending'],set:['sets','setting'],show:['showed','shown','shows','showing'],
  sit:['sat','sits','sitting'],sleep:['slept','sleeps','sleeping'],speak:['spoke','spoken','speaks','speaking'],
  spend:['spent','spends','spending'],stand:['stood','stands','standing'],take:['took','taken','takes','taking'],
  teach:['taught','teaches','teaching'],tell:['told','tells','telling'],think:['thought','thinks','thinking'],
  understand:['understood','understands','understanding'],write:['wrote','written','writes','writing'],
  cost:['costs','costing'],cut:['cuts','cutting'],hit:['hits','hitting'],hurt:['hurts','hurting'],
  quit:['quits','quitting'],shut:['shuts','shutting'],burst:['bursts','bursting'],cast:['casts','casting'],
  rise:['rose','risen','rises','rising'],arise:['arose','arisen','arises','arising'],ride:['rode','ridden','rides','riding'],
  win:['won','wins','winning'],begin:['began','begun','begins','beginning'],swim:['swam','swum','swims','swimming'],
  sing:['sang','sung','sings','singing'],ring:['rang','rung','rings','ringing'],
  blow:['blew','blown','blows','blowing'],grow:['grew','grown','grows','growing'],throw:['threw','thrown','throws','throwing'],
  fly:['flew','flown','flies','flying'],swear:['swore','sworn','swears','swearing'],wear:['wore','worn','wears','wearing'],
  tear:['tore','torn','tears','tearing'],bear:['bore','born','borne','bears','bearing'],
  choose:['chose','chosen','chooses','choosing'],freeze:['froze','frozen','freezes','freezing'],
  steal:['stole','stolen','steals','stealing'],strike:['struck','stricken','strikes','striking'],
  build:['built','builds','building'],burn:['burnt','burned','burns','burning'],
  bite:['bit','bitten','bites','biting'],hide:['hid','hidden','hides','hiding'],
  shoot:['shot','shoots','shooting'],shake:['shook','shaken','shakes','shaking'],
  lie:['lay','lain','lies','lying'],lay:['laid','lays','laying'],
  bend:['bent','bends','bending'],lend:['lent','lends','lending'],
  wind:['wound','winds','winding'],bind:['bound','binds','binding'],grind:['ground','grinds','grinding'],
  catch:['caught','catches','catching'],fight:['fought','fights','fighting'],seek:['sought','seeks','seeking'],
  can:['could'],will:['would'],shall:['should'],
}

const ARTICLES = `(?:a|an|the|one|any|some|another|that|this)`
const POSSESSIVES = `(?:my|your|his|her|their|our|its)`

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verbStem(word: string): string {
  const esc = escapeRe(word)
  const irr = IRREGULAR_VERBS[word.toLowerCase()]
  if (irr) return `(?:${[word.toLowerCase(), ...irr].map(escapeRe).join('|')})`
  if (/[^aeiou]y$/i.test(word)) {
    const stem = escapeRe(word.slice(0, -1))
    return `(?:${esc}|${stem}ied|${stem}ies|${stem}ying)`
  }
  if (/e$/i.test(word)) {
    const stem = escapeRe(word.slice(0, -1))
    return `(?:${esc}|${esc}s|${esc}d|${stem}ing|${stem}ed)`
  }
  return `${esc}[a-z]{0,4}`
}

function nounPlural(word: string): string {
  const esc = escapeRe(word)
  if (/[^aeiou]y$/i.test(word)) {
    const stem = escapeRe(word.slice(0, -1))
    return `(?:${esc}|${stem}ies)`
  }
  if (/(s|sh|ch|x|z)$/i.test(word)) return `(?:${esc}|${esc}es)`
  return `${esc}s?`
}

function phraseWordPattern(word: string, isFirst: boolean, isLast: boolean): string {
  const lower = word.toLowerCase()
  if (lower === 'a' || lower === 'an') return ARTICLES
  if (['my','your','his','her','their','our','its'].includes(lower)) return POSSESSIVES
  if (lower === 'be') return `(?:${['be', ...IRREGULAR_VERBS.be].map(escapeRe).join('|')})`
  if (!isFirst && IRREGULAR_VERBS[lower]) {
    return `(?:${[lower, ...IRREGULAR_VERBS[lower]].map(escapeRe).join('|')})`
  }
  if (isFirst) return verbStem(word)
  if (isLast) return nounPlural(word)
  return escapeRe(word)
}

const PHRASE_SLOT_PATTERN = /\b(?:someone(?:'s)?|somebody(?:'s)?|something|one's|oneself|sb(?:'s)?|sth|doing)\b(?:\/\w+)?/gi

export function buildPhraseSpanRegex(phrase: string): string {
  const stripped = stripPhraseParens(phrase)
  const parts0 = stripped.split(PHRASE_SLOT_PATTERN).map(p => p.trim()).filter(Boolean)
  // 末尾の "do" (「agree to do」等の不定詞プレースホルダ) を落とす
  const parts = parts0.map(p => p.replace(/\s+do\s*$/, '').trim()).filter(Boolean)
  if (parts.length === 0) return '(?!)'
  const FILLER = "[\\w'\\-]+(?:\\s+[\\w'\\-]+){0,2}"
  const partPatterns = parts.map((part, pIdx) => {
    const words = part.split(/\s+/)
    const wordPats = words.map((w, wIdx) => phraseWordPattern(
      w,
      pIdx === 0 && wIdx === 0,
      pIdx === parts.length - 1 && wIdx === words.length - 1,
    ))
    // 同じ part 内の単語間に副詞フィラー 0-3 語を許容
    return wordPats.reduce((acc, pat, i) => i === 0 ? pat : `${acc}(?:\\s+[\\w'\\-]+){0,3}\\s+${pat}`, '')
  })
  // スロット位置は 0〜3 語の filler を許容 (省略も OK)
  const SLOT_SEP = `(?:\\s+${FILLER})?\\s+`
  return `\\b${partPatterns.join(SLOT_SEP)}\\b`
}
