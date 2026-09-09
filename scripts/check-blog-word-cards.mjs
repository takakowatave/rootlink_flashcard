#!/usr/bin/env node
/**
 * ブログ本文の <word-card word="X" sense="N" /> を全部集めて
 * dictionary_cache に存在するか、sense 番号が有効範囲かを確認する事前監査。
 *
 * 執筆者が公開前に走らせて、未 cache 単語や sense 範囲外を先に潰す用途。
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=$(gcloud secrets versions access latest --secret=SUPABASE_SERVICE_ROLE_KEY) \
 *     node scripts/check-blog-word-cards.mjs
 *   # 下書き含めて確認したい場合
 *   ... node scripts/check-blog-word-cards.mjs --include-drafts
 *   # 特定記事だけ
 *   ... node scripts/check-blog-word-cards.mjs --slug historic-vs-historical
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ybfdlsjuscgspkcgwist.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY が必要 (gcloud secrets から取得)')
  process.exit(1)
}

const args = process.argv.slice(2)
const argOf = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }
const includeDrafts = args.includes('--include-drafts')
const slugFilter = argOf('--slug')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const WORD_CARD_RE = /<word-card\s+([^/>]+?)\s*(?:\/>|><\/word-card>)/gi

function extractEntries(markdown) {
  const out = []
  let m
  while ((m = WORD_CARD_RE.exec(markdown)) !== null) {
    const attrs = m[1]
    const wordMatch = /word=["']([^"']+)["']/i.exec(attrs)
    if (!wordMatch) continue
    const word = wordMatch[1].trim().toLowerCase()
    if (!word) continue
    const senseMatch = /sense=["']([^"']+)["']/i.exec(attrs)
    const senseNum = senseMatch ? Number.parseInt(senseMatch[1], 10) : NaN
    const senseIndex = Number.isFinite(senseNum) && senseNum >= 1 ? senseNum : undefined
    out.push({ word, senseIndex })
  }
  return out
}

function countFlatSenses(payload) {
  if (!payload || !Array.isArray(payload.senseGroups)) return 0
  let n = 0
  for (const g of payload.senseGroups) {
    for (const s of g?.senses ?? []) {
      const senseId = String(s?.senseId ?? '')
      const meaningEn = typeof s?.definition === 'string' ? s.definition : String(s?.definition?.en ?? '')
      if (senseId && meaningEn) n += 1
    }
  }
  return n
}

async function main() {
  let query = supabase
    .from('posts')
    .select('slug, title, content, published_at')
    .order('created_at', { ascending: false })
  if (!includeDrafts) query = query.not('published_at', 'is', null)
  if (slugFilter) query = query.eq('slug', slugFilter)

  const { data: posts, error } = await query
  if (error) {
    console.error('posts fetch error:', error.message)
    process.exit(1)
  }

  const perPost = []
  const allWords = new Set()
  for (const post of posts ?? []) {
    const entries = extractEntries(post.content ?? '')
    if (entries.length === 0) continue
    for (const e of entries) allWords.add(e.word)
    perPost.push({ post, entries })
  }

  if (perPost.length === 0) {
    console.log('word-card を含む記事はありません')
    return
  }

  // dictionary_cache から payload を一括取得
  const wordList = [...allWords]
  const cacheMap = new Map()
  const chunkSize = 200
  for (let i = 0; i < wordList.length; i += chunkSize) {
    const chunk = wordList.slice(i, i + chunkSize)
    const { data: rows } = await supabase
      .from('words')
      .select('word, dictionary_cache!inner(payload)')
      .in('word', chunk)
    for (const r of rows ?? []) {
      const cache = Array.isArray(r.dictionary_cache) ? r.dictionary_cache[0] : r.dictionary_cache
      cacheMap.set(r.word, cache?.payload ?? null)
    }
  }

  let totalIssues = 0
  for (const { post, entries } of perPost) {
    const issues = []
    for (const e of entries) {
      const payload = cacheMap.get(e.word)
      if (payload == null) {
        issues.push({ word: e.word, kind: 'missing_cache' })
        continue
      }
      const total = countFlatSenses(payload)
      if (e.senseIndex != null && (e.senseIndex < 1 || e.senseIndex > total)) {
        issues.push({ word: e.word, kind: 'sense_out_of_range', senseIndex: e.senseIndex, total })
      }
    }
    const status = post.published_at ? '公開済' : '下書き'
    const header = `[${status}] /${post.slug} — ${post.title}`
    if (issues.length === 0) {
      console.log(`✓ ${header}  (word-card ${entries.length}件、問題なし)`)
    } else {
      totalIssues += issues.length
      console.log(`✗ ${header}`)
      for (const i of issues) {
        if (i.kind === 'missing_cache') {
          console.log(`   ・${i.word} は dictionary_cache に未登録`)
        } else {
          console.log(`   ・${i.word} の sense=${i.senseIndex} は範囲外（有効: 1〜${i.total}）`)
        }
      }
    }
  }

  console.log('')
  if (totalIssues === 0) {
    console.log(`✅ すべて OK（記事${perPost.length}件、単語${wordList.length}件）`)
  } else {
    console.log(`⚠️  ${totalIssues}件の問題があります`)
    process.exit(1)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
