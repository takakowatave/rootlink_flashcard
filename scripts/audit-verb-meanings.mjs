#!/usr/bin/env node
/**
 * deck-scope の dictionary_cache から「動詞 POS なのに meaning が動詞形になってない」
 * sense を検出する監査スクリプト (read-only、OpenAI / Oxford 課金一切なし)。
 *
 * 判定: senseGroups[].partOfSpeech が verb/phrasal_verb で、
 *       locales.ja.senses[senseId].meaning が
 *         - 動詞語尾 (う/く/ぐ/す/つ/ぬ/ぶ/む/る) で終わらない
 *         - かつ 「〜する」「〜できる」でも終わらない
 *       → mismatch と判定
 *
 * 用途: 月1で回して残件確認。0 件なら 5 秒で終わる。
 *       件数が出たら Claude が判定・修正 (execute_sql 直書き) する運用。
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=$(gcloud secrets versions access latest --secret=SUPABASE_SERVICE_ROLE_KEY) \
 *     node scripts/audit-verb-meanings.mjs
 *   # JSON で出力ファイル指定
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/audit-verb-meanings.mjs --out /tmp/verb-audit.json
 */

import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ybfdlsjuscgspkcgwist.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY が必要 (gcloud secrets から取得)')
  process.exit(1)
}

const args = process.argv.slice(2)
const argOf = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }
const outFile = argOf('--out')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const VERB_ENDINGS = new Set(['う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る'])

function isVerbForm(meaning) {
  if (!meaning) return false
  const trimmed = meaning.trim()
  if (!trimmed) return false
  if (trimmed.endsWith('する') || trimmed.endsWith('できる')) return true
  return VERB_ENDINGS.has(trimmed.slice(-1))
}

async function fetchDeckWordIds() {
  const words = new Set()
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('deck_words')
      .select('word')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`deck_words: ${error.message}`)
    if (!data || data.length === 0) break
    for (const row of data) if (row.word) words.add(row.word)
    if (data.length < pageSize) break
    from += pageSize
  }
  const wordList = Array.from(words)
  const ids = []
  for (let i = 0; i < wordList.length; i += 200) {
    const chunk = wordList.slice(i, i + 200)
    const { data, error } = await supabase
      .from('words')
      .select('id, word')
      .in('word', chunk)
    if (error) throw new Error(`words: ${error.message}`)
    for (const row of data ?? []) ids.push({ id: row.id, word: row.word })
  }
  return ids
}

async function fetchPayloads(wordIds) {
  const out = []
  for (let i = 0; i < wordIds.length; i += 100) {
    const chunk = wordIds.slice(i, i + 100).map((w) => w.id)
    const { data, error } = await supabase
      .from('dictionary_cache')
      .select('word_id, payload')
      .in('word_id', chunk)
    if (error) throw new Error(`dictionary_cache: ${error.message}`)
    for (const row of data ?? []) out.push(row)
  }
  return out
}

function findMismatches(wordMap, caches) {
  const mismatches = []
  for (const row of caches) {
    const word = wordMap.get(row.word_id) ?? '(unknown)'
    const payload = row.payload
    if (!payload) continue
    const jaSenses = payload?.locales?.ja?.senses ?? {}
    for (const group of payload.senseGroups ?? []) {
      const pos = String(group.partOfSpeech ?? '').toLowerCase()
      if (pos !== 'verb' && pos !== 'phrasal_verb') continue
      for (const sense of group.senses ?? []) {
        const senseId = sense.senseId
        if (!senseId) continue
        const ja = jaSenses[senseId]?.meaning
        if (!ja) continue
        if (isVerbForm(ja)) continue
        mismatches.push({
          word,
          word_id: row.word_id,
          sense_id: senseId,
          pos,
          ja_meaning: ja,
          en_definition: sense.definition ?? null,
        })
      }
    }
  }
  return mismatches
}

async function main() {
  console.error('deck_words を取得中...')
  const wordIds = await fetchDeckWordIds()
  console.error(`  ${wordIds.length} words`)

  console.error('dictionary_cache を取得中...')
  const caches = await fetchPayloads(wordIds)
  console.error(`  ${caches.length} caches`)

  const wordMap = new Map(wordIds.map((w) => [w.id, w.word]))
  const mismatches = findMismatches(wordMap, caches)

  const summary = {
    checked_words: wordIds.length,
    checked_caches: caches.length,
    mismatch_count: mismatches.length,
    mismatches,
  }

  if (outFile) {
    writeFileSync(outFile, JSON.stringify(summary, null, 2))
    console.error(`書き出し: ${outFile}`)
  }

  console.log(JSON.stringify({
    checked_words: summary.checked_words,
    checked_caches: summary.checked_caches,
    mismatch_count: summary.mismatch_count,
  }, null, 2))

  if (mismatches.length > 0) {
    console.error(`\n=== 残件 ${mismatches.length} 件 ===`)
    for (const m of mismatches.slice(0, 30)) {
      console.error(`  ${m.word.padEnd(20)} ${m.sense_id}  ${m.ja_meaning}`)
    }
    if (mismatches.length > 30) console.error(`  ... 他 ${mismatches.length - 30} 件 (JSON は --out で保存)`)
  } else {
    console.error('\n残件 0 件。clean.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
