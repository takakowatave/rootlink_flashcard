#!/usr/bin/env node
/**
 * 予約された X 投稿を実行するスクリプト。
 *
 * 使い方:
 *   node scripts/post-scheduled.mjs           # 予約時刻に達したエントリを投稿
 *   node scripts/post-scheduled.mjs --dry-run # 対象を表示するだけで投稿しない
 *
 * 入力: posts/schedule.json
 *   [{ "word": "avocado", "postAt": "2026-08-17T20:00:00+09:00", "text": "..." }, ...]
 *
 * 出力: 投稿成功したエントリに postedAt と tweetId を追記して同ファイルを更新。
 *
 * 画像は https://www.rootlink.app/word/<word>/card.png?v=<ts> から取得（キャッシュバスタ付き）。
 * 30KB 未満のフォールバック画像が返ってきた場合は投稿を中止する（誤爆防止）。
 *
 * 必要な env:
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TwitterApi } from 'twitter-api-v2'

const SCHEDULE_PATH = join(process.cwd(), 'posts/schedule.json')
const CARD_BASE = process.env.CARD_BASE_URL ?? 'https://www.rootlink.app'
const THIN_BYTES = 30_000
const DRY_RUN = process.argv.includes('--dry-run')

function requireEnv() {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = process.env
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    throw new Error(
      'Missing X API credentials. Set X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET.'
    )
  }
  return { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET }
}

async function fetchCardImage(word) {
  const url = `${CARD_BASE}/word/${encodeURIComponent(word)}/card.png?v=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`fetch card failed: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < THIN_BYTES) {
    throw new Error(
      `card image is only ${buf.length} bytes (< ${THIN_BYTES}). ` +
        `Likely fallback (no etymology in dictionary_cache). Aborting.`
    )
  }
  return buf
}

async function postEntry(client, entry) {
  const img = await fetchCardImage(entry.word)
  const mediaId = await client.v1.uploadMedia(img, { mimeType: 'image/png' })
  const { data } = await client.v2.tweet({
    text: entry.text,
    media: { media_ids: [mediaId] },
  })
  return data.id
}

async function main() {
  const raw = await readFile(SCHEDULE_PATH, 'utf-8')
  const schedule = JSON.parse(raw)
  const now = Date.now()

  const due = schedule.filter((e) => !e.postedAt && new Date(e.postAt).getTime() <= now)

  if (!due.length) {
    console.log(`No due entries at ${new Date(now).toISOString()}`)
    return
  }

  console.log(`Due entries (${due.length}): ${due.map((e) => e.word).join(', ')}`)

  if (DRY_RUN) {
    console.log('--dry-run: not posting.')
    return
  }

  const creds = requireEnv()
  const client = new TwitterApi({
    appKey: creds.X_API_KEY,
    appSecret: creds.X_API_SECRET,
    accessToken: creds.X_ACCESS_TOKEN,
    accessSecret: creds.X_ACCESS_TOKEN_SECRET,
  })

  let changed = false
  for (const entry of due) {
    try {
      console.log(`Posting: ${entry.word}`)
      const tweetId = await postEntry(client, entry)
      entry.postedAt = new Date().toISOString()
      entry.tweetId = tweetId
      changed = true
      console.log(`  ✓ tweetId=${tweetId}`)
    } catch (err) {
      console.error(`  ✗ ${entry.word}: ${err.message}`)
    }
  }

  if (changed) {
    await writeFile(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + '\n')
    console.log('Updated posts/schedule.json')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
