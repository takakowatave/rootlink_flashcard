/**
 * JMdict を逆引きして deck_words.meaning（和訳）を埋めるスクリプト
 *
 * JMdict は「日本語見出し → 英語 gloss」の辞書。
 * 英単語 → 日本語訳が欲しいので、gloss から日本語見出しを逆引きする。
 *
 * 使い方:
 *   node scripts/jmdict-fill-meanings.mjs --label TOEIC --dry-run        # 候補プレビューのみ
 *   node scripts/jmdict-fill-meanings.mjs --label TOEIC --limit 50 --dry-run
 *   node scripts/jmdict-fill-meanings.mjs --label TOEIC                  # 実際にDBへ書き込み
 *
 * JMdict_e は初回のみ /tmp にダウンロードしてキャッシュする。
 */

import { createClient } from '@supabase/supabase-js'
import { gunzipSync } from 'node:zlib'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const JMDICT_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz'
const JMDICT_CACHE = '/tmp/JMdict_e.xml'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('環境変数が不足: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_(SERVICE_ROLE|ANON)_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const get = (f) => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null }
const label = get('--label') ?? 'TOEIC'
const limit = parseInt(get('--limit') ?? '99999', 10)
const dryRun = args.includes('--dry-run')

/** JMdict をダウンロード（初回のみ）して XML 文字列を返す。 */
async function loadJmdict() {
  if (existsSync(JMDICT_CACHE)) {
    console.log('JMdict キャッシュ利用:', JMDICT_CACHE)
    return readFileSync(JMDICT_CACHE, 'utf8')
  }
  console.log('JMdict ダウンロード中...', JMDICT_URL)
  const res = await fetch(JMDICT_URL)
  if (!res.ok) throw new Error(`JMdict ダウンロード失敗: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const xml = gunzipSync(buf).toString('utf8')
  writeFileSync(JMDICT_CACHE, xml)
  console.log('JMdict 保存:', JMDICT_CACHE, `(${(xml.length / 1e6).toFixed(0)}MB)`)
  return xml
}

/**
 * gloss(英語小文字) → [{ jp, common }] の逆引きマップを作る。
 * jp は漢字見出し優先、なければ かな見出し。
 * common は news1/ichi1/spec1/... の優先タグがあるか。
 */
function buildReverseIndex(xml) {
  const map = new Map()
  const entries = xml.split('<entry>')
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i]

    // 日本語見出し（漢字優先、なければ かな）
    const keb = entry.match(/<keb>(.*?)<\/keb>/)?.[1]
    const reb = entry.match(/<reb>(.*?)<\/reb>/)?.[1]
    const jp = keb ?? reb
    if (!jp) continue

    const hasKanji = !!keb && /[一-鿿]/.test(keb)
    // 純粋なカタカナ見出し（＝英語のカタカナ読みであることが多い）
    const isKatakana = !hasKanji && /^[゠-ヿ・ー]+$/.test(jp)
    const common = /<(ke|re)_pri>(news1|ichi1|spec1|spec2|gai1)<\/(ke|re)_pri>/.test(entry)

    // すべての gloss を拾う（位置も保持: 0 = その項目の主たる訳）
    const glosses = [...entry.matchAll(/<gloss(?:\s[^>]*)?>(.*?)<\/gloss>/g)].map((m) => m[1])
    glosses.forEach((g, gi) => {
      const key = g.toLowerCase().trim()
      if (!key) return
      if (!map.has(key)) map.set(key, [])
      map.get(key).push({ jp, hasKanji, isKatakana, common, primary: gi === 0 })
    })
  }
  return map
}

/** 英単語に対する最良の和訳を選ぶ。 */
function pickMeaning(map, word) {
  const w = word.toLowerCase().trim()
  // 完全一致の gloss、動詞の "to xxx" 形も照合
  const candidates = [
    ...(map.get(w) ?? []),
    ...(map.get(`to ${w}`) ?? []),
  ]
  if (candidates.length === 0) return null

  // 主たる訳(primary) → common → 漢字見出し を優先。カタカナ(英語読み)は最後尾。
  const score = (c) =>
    (c.primary ? 4 : 0) + (c.common ? 2 : 0) + (c.hasKanji ? 1 : 0) - (c.isKatakana ? 5 : 0)
  const sorted = candidates.sort((a, b) => score(b) - score(a))
  const seen = new Set()
  const picks = []
  for (const c of sorted) {
    if (seen.has(c.jp)) continue
    seen.add(c.jp)
    picks.push(c.jp)
    if (picks.length >= 2) break
  }
  return picks.join('、')
}

async function fetchDeckWords() {
  const { data, error } = await supabase
    .from('deck_words')
    .select('id, word, decks!inner(label)')
    .eq('decks.label', label)
    .limit(5000)
  if (error) throw error
  return data ?? []
}

async function main() {
  const xml = await loadJmdict()
  console.log('逆引きインデックス構築中...')
  const map = buildReverseIndex(xml)
  console.log('gloss 数:', map.size)

  const rows = await fetchDeckWords()
  console.log(`対象 ${label}: ${rows.length}語\n`)

  let hit = 0
  let miss = 0
  const updates = []
  for (const row of rows.slice(0, limit)) {
    const meaning = pickMeaning(map, row.word)
    if (meaning) {
      hit++
      if (dryRun) console.log(`✅ ${row.word.padEnd(20)} → ${meaning}`)
      else updates.push({ id: row.id, meaning })
    } else {
      miss++
      if (dryRun) console.log(`❌ ${row.word.padEnd(20)} → (なし)`)
    }
  }

  console.log(`\nヒット ${hit} / ミス ${miss}（カバー率 ${((hit / (hit + miss)) * 100).toFixed(1)}%）`)

  if (!dryRun && updates.length > 0) {
    console.log(`\nDBへ書き込み中... ${updates.length}件`)
    for (const u of updates) {
      const { error } = await supabase.from('deck_words').update({ meaning: u.meaning }).eq('id', u.id)
      if (error) console.error('UPDATE失敗:', u.id, error.message)
    }
    console.log('完了')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
