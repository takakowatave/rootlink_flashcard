#!/usr/bin/env node
/**
 * X投稿用の単語カード画像を一括ダウンロードする。
 *
 * 使い方:
 *   node scripts/fetch-card-images.mjs
 *   node scripts/fetch-card-images.mjs avocado ketchup   # 単語を指定
 *
 * 保存先: ./x-cards/<word>.png
 *
 * 語源データが dictionary_cache に無い単語はフォールバック画像
 * （見出し語だけのカード）が返るため、ファイルサイズが小さくなる。
 * 実行後のログでサイズを確認し、小さいものは先にアプリで検索して
 * キャッシュを作ってから再実行すること。
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const BASE = process.env.CARD_BASE_URL ?? 'https://www.rootlink.app'
const OUT_DIR = join(process.cwd(), 'x-cards')

// Notion「投稿ストック・実績」と同じ並び
const WORDS = [
  'sundae', 'salary', 'panic', 'companion',
  'muscle', 'shampoo', 'disaster', 'denim', 'magazine', 'cereal', 'nice',
  'avocado', 'ketchup', 'quarantine', 'sandwich', 'tuxedo', 'bikini',
  'jumbo', 'curfew', 'calculate', 'alcohol', 'algebra', 'candidate',
  'salad', 'dandelion', 'vaccine', 'rival', 'lunatic', 'influenza',
  'cappuccino', 'tulip', 'slave', 'gorilla', 'clue', 'nightmare',
  'window', 'breakfast', 'goodbye', 'robot', 'chocolate', 'bankrupt',
]

// フォールバック画像（見出し語のみ）の目安。これ以下なら語源が入っていない可能性が高い
const THIN_BYTES = 30_000

async function fetchCard(word) {
  const url = `${BASE}/word/${encodeURIComponent(word)}/card.png`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(join(OUT_DIR, `${word}.png`), buf)
  return buf.length
}

async function main() {
  const targets = process.argv.slice(2).length ? process.argv.slice(2) : WORDS
  await mkdir(OUT_DIR, { recursive: true })

  const thin = []
  const failed = []

  for (const word of targets) {
    try {
      const bytes = await fetchCard(word)
      const kb = (bytes / 1024).toFixed(0)
      const mark = bytes < THIN_BYTES ? ' ⚠️ 語源なしの可能性' : ''
      if (bytes < THIN_BYTES) thin.push(word)
      console.log(`✓ ${word.padEnd(12)} ${kb.padStart(4)} KB${mark}`)
    } catch (err) {
      failed.push(word)
      console.log(`✗ ${word.padEnd(12)} ${err.message}`)
    }
    // Cloud Run / Vercel に優しく
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`\n保存先: ${OUT_DIR}`)
  if (thin.length) {
    console.log(`\n⚠️ 語源が入っていない可能性: ${thin.join(', ')}`)
    console.log('   アプリで一度検索してキャッシュを作ってから再実行してください。')
  }
  if (failed.length) {
    console.log(`\n✗ 取得失敗: ${failed.join(', ')}`)
  }
}

main()
