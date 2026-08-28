#!/usr/bin/env node
/**
 * dictionary_cache に example が null のまま残っている saved_words を
 * Cloud Run /resolve に流して hydrateCachedDictionary を発火させる。
 *
 * 対象語は事前に Supabase MCP で列挙して WORDS 定数に貼る運用。
 * anon key では dictionary_cache が読めないのでスクリプト側では自動列挙しない。
 *
 * Usage:
 *   node scripts/backfill-missing-examples.mjs
 */

const API_URL = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL ?? 'https://rootlink-server-v2-774622345521.asia-northeast1.run.app'

const WORDS = [
  'acute', 'aesthetician', 'affluent', 'agreement', 'appeal', 'apprehensive',
  'behind', 'blubber', 'bottleneck', 'bustle', 'chrysanthemum', 'clamp',
  'clutch', 'collision', 'comparison', 'complaint', 'crook', 'crummy',
  'crumple', 'deep', 'dewy', 'differentiation', 'dissociation', 'downtime',
  'draught', 'equation', 'execute', 'fast_forward', 'fervent', 'foul',
  'fume', 'gaggle', 'glaze', 'go', 'goggle', 'guinea', 'habit',
  'hyperaesthesia', 'illegal', 'immunity', 'incorporate', 'interference',
  'intervene', 'intrude', 'invisible', 'irritate', 'lofty', 'lose', 'master',
  'menagerie', 'minuscule', 'mistletoe', 'mullion', 'mundane', 'muster',
  'ovary', 'palmistry', 'peep', 'plinth', 'plummet', 'posterior', 'preserve',
  'procedure', 'psychology', 'quiver', 'rack', 'recruit', 'regress', 'rick',
  'scandalize', 'shaken', 'stagger', 'stifle', 'strand', 'streak', 'subsidy',
  'sullen', 'sweep', 'take', 'tonsil', 'totter', 'turbulent', 'uphold',
  'vivid', 'void', 'vomit', 'weird', 'whirlpool', 'whoop', 'wildfire', 'workhorse',
]

async function resolveWord(word) {
  const q = word.replace(/_/g, ' ')
  const res = await fetch(`${API_URL}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  })
  const text = await res.text()
  return { status: res.status, body: text.slice(0, 300) }
}

async function main() {
  const HARD_CAP_WITHOUT_ACK = 100
  const ackCost = process.argv.includes('--i-know-the-cost')
  console.log(`Target: ${WORDS.length} words`)
  console.log(`⚠️  最大 ${WORDS.length * 2} Oxford API call 発生の可能性`)
  if (!ackCost && WORDS.length > HARD_CAP_WITHOUT_ACK) {
    console.error(`❌ ${HARD_CAP_WITHOUT_ACK} 語超は --i-know-the-cost を明示すること。中止。`)
    process.exit(1)
  }
  let ok = 0
  let fail = 0
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i]
    process.stdout.write(`[${i + 1}/${WORDS.length}] ${w} ... `)
    try {
      const r = await resolveWord(w)
      if (r.status === 200) {
        console.log('ok')
        ok++
      } else {
        console.log(`FAIL ${r.status} ${r.body}`)
        fail++
      }
    } catch (e) {
      console.log('ERR', e.message)
      fail++
    }
    // rate limit: 30/min → 2.2s 間隔
    await new Promise(r => setTimeout(r, 2200))
  }
  console.log(`\nDone. ok=${ok} fail=${fail}`)
}

main().catch(e => { console.error(e); process.exit(1) })
