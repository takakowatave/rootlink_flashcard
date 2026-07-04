/**
 * デッキ単語の音声を事前生成するスクリプト
 *
 * 使い方:
 *   node scripts/prefetch-audio.mjs --label TOEIC
 *   node scripts/prefetch-audio.mjs --deck "TOEIC 730+"
 *   node scripts/prefetch-audio.mjs --label TOEIC --limit 200 --delay 1000
 *
 * オプション:
 *   --label   対象ラベル (TOEIC / IELTS / TOEFL / 英検)
 *   --deck    対象デッキ名
 *   --limit   上限語数 (デフォルト: 500)
 *   --delay   単語間の待機時間ms (デフォルト: 800)
 *   --dry-run 対象単語リストだけ表示
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const API_BASE = (process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ?? 'https://rootlink-server-v2-774622345521.asia-northeast1.run.app').replace(/\/$/, '')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('環境変数が不足しています: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const args = process.argv.slice(2)
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }
const label = get('--label')
const deckName = get('--deck')
const limit = parseInt(get('--limit') ?? '500', 10)
const delayMs = parseInt(get('--delay') ?? '800', 10)
const dryRun = args.includes('--dry-run')

async function fetchWordsWithoutAudio() {
  // 対象デッキのIDを取得
  let deckQuery = supabase.from('decks').select('id, name, label')
  if (label) deckQuery = deckQuery.eq('label', label)
  if (deckName) deckQuery = deckQuery.eq('name', deckName)
  const { data: decks, error: deckErr } = await deckQuery
  if (deckErr) throw deckErr
  if (!decks || decks.length === 0) { console.error('対象デッキが見つかりません'); return [] }

  const deckIds = decks.map(d => d.id)
  console.log(`対象デッキ: ${decks.map(d => d.name).join(', ')}`)

  // デッキの全単語を取得
  const PAGE_SIZE = 1000
  let allWords = []
  let offset = 0
  while (true) {
    const { data: rows, error } = await supabase
      .from('deck_words').select('word').in('deck_id', deckIds)
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    if (!rows || rows.length === 0) break
    allWords.push(...rows.map(r => r.word).filter(Boolean))
    if (rows.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  const uniqueWords = [...new Set(allWords)]
  console.log(`デッキ合計単語数（ユニーク）: ${uniqueWords.length}語`)

  // word_id を取得
  const wordIdByWord = new Map()
  for (let i = 0; i < uniqueWords.length; i += 100) {
    const chunk = uniqueWords.slice(i, i + 100)
    const { data: wordRows } = await supabase.from('words').select('id, word').in('word', chunk)
    ;(wordRows ?? []).forEach(r => wordIdByWord.set(r.word, r.id))
  }

  // 音声キャッシュ済みのword_idを確認
  const audioWordIds = new Set()
  const existingIds = [...wordIdByWord.values()]
  for (let i = 0; i < existingIds.length; i += 100) {
    const chunk = existingIds.slice(i, i + 100)
    const { data: cacheRows } = await supabase
      .from('dictionary_cache').select('word_id')
      .in('word_id', chunk)
      .not('payload->audio->audioPath', 'is', null)
    ;(cacheRows ?? []).forEach(r => audioWordIds.add(r.word_id))
  }

  // 音声未生成の単語のみ返す
  const withoutAudio = uniqueWords.filter(w => {
    const id = wordIdByWord.get(w)
    return id && !audioWordIds.has(id)
  })

  console.log(`音声未生成: ${withoutAudio.length}語`)
  return withoutAudio.slice(0, limit)
}

async function main() {
  console.log(`\n🔊 音声未生成単語を取得中...\n`)
  const words = await fetchWordsWithoutAudio()
  console.log(`\n処理対象: ${words.length}語\n`)

  if (words.length === 0) { console.log('✅ 全語音声生成済みです'); return }
  if (dryRun) {
    console.log('--- dry-run ---')
    words.forEach((w, i) => console.log(`  ${i + 1}. ${w}`))
    return
  }

  let ok = 0, ng = 0
  const start = Date.now()

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    process.stdout.write(`[${i + 1}/${words.length}] ${word} ... `)
    try {
      const res = await fetch(`${API_BASE}/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      })
      const data = await res.json()
      if (data.ok) { ok++; console.log('✅') }
      else { ng++; console.log(`❌ (${data.reason})`) }
    } catch (e) {
      ng++
      console.log(`❌ (${e.message})`)
    }
    if (i < words.length - 1) await new Promise(r => setTimeout(r, delayMs))
  }

  const elapsed = Math.round((Date.now() - start) / 1000)
  console.log(`\n完了: ✅ ${ok}語 / ❌ ${ng}語 (${elapsed}秒)`)
}

main().catch(e => { console.error(e); process.exit(1) })
