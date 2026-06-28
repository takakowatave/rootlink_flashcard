/**
 * デッキ単語の辞書データを事前フェッチするスクリプト
 *
 * 使い方:
 *   node scripts/prefetch-deck-words.mjs --label TOEIC --limit 100
 *   node scripts/prefetch-deck-words.mjs --label IELTS --limit 50
 *   node scripts/prefetch-deck-words.mjs --limit 100   # 全ラベル
 *
 * オプション:
 *   --label   対象ラベル (TOEIC / IELTS / TOEFL / 英検)
 *   --limit   1回の実行で処理する上限語数 (デフォルト: 100)
 *   --dry-run 実際には叩かず、対象単語リストだけ表示
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const API_BASE = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ?? 'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('環境変数が不足しています: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 引数パース
const args = process.argv.slice(2)
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }
const label = get('--label')
const limit = parseInt(get('--limit') ?? '100', 10)
const dryRun = args.includes('--dry-run')

async function fetchUncachedWords() {
  let query = supabase
    .from('deck_words')
    .select('word, decks!inner(label)')
    .limit(limit * 3) // 余裕を持って取得（重複除去後にlimitをかける）

  if (label) query = query.eq('decks.label', label)

  const { data: deckRows, error } = await query
  if (error) throw error

  const words = [...new Set((deckRows ?? []).map(r => r.word))].filter(Boolean)

  // dictionary_cache に存在するか確認
  const { data: wordRows } = await supabase
    .from('words')
    .select('id, word')
    .in('word', words)

  const wordIdByWord = new Map((wordRows ?? []).map(r => [r.word, r.id]))
  const existingIds = [...wordIdByWord.values()]

  const cachedWordIds = new Set()
  if (existingIds.length > 0) {
    const { data: cacheRows } = await supabase
      .from('dictionary_cache')
      .select('word_id')
      .in('word_id', existingIds)
    ;(cacheRows ?? []).forEach(r => cachedWordIds.add(r.word_id))
  }

  const uncached = words.filter(w => {
    const id = wordIdByWord.get(w)
    return !id || !cachedWordIds.has(id)
  })

  return uncached.slice(0, limit)
}

async function resolveWord(word) {
  const res = await fetch(`${API_BASE}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: word }),
  })
  return res.ok
}

async function main() {
  console.log(`\n🔍 未キャッシュ単語を取得中... (label=${label ?? '全て'}, limit=${limit})`)
  const words = await fetchUncachedWords()
  console.log(`対象: ${words.length}語\n`)

  if (words.length === 0) {
    console.log('✅ 全語キャッシュ済みです')
    return
  }

  if (dryRun) {
    console.log('--- dry-run: 以下の単語をフェッチ予定 ---')
    words.forEach((w, i) => console.log(`  ${i + 1}. ${w}`))
    return
  }

  let ok = 0
  let ng = 0
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    process.stdout.write(`[${i + 1}/${words.length}] ${word} ... `)
    try {
      const success = await resolveWord(word)
      if (success) { ok++; console.log('✅') }
      else { ng++; console.log('❌ (not found)') }
    } catch (e) {
      ng++
      console.log(`❌ (error: ${e.message})`)
    }
    // レート制限: 1.5秒待機
    if (i < words.length - 1) await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n完了: ✅ ${ok}語 / ❌ ${ng}語`)
}

main().catch(e => { console.error(e); process.exit(1) })
