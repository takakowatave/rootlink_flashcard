#!/usr/bin/env node
/**
 * dictionary_cache.payload.locales.ja.senses[*].meaning を meaning-only で再生成する。
 *
 * 対象: first-sense meaning が anti-pattern (〜な状態 / 〜な性質 / 〜な様子 / 〜行為 /
 *   〜もの / 〜する道具 / 20字以上の説明文 等) に該当する word。
 * 対象 word の**全 sense** の meaning を差し替える。
 * Oxford API は叩かない。definition / example / etymology は触らない。
 *
 * 候補リストは事前に Supabase MCP から生成する運用 (12k 行を anon で pull しない):
 *   /tmp/meaning-candidates.json = [{"id":"...","word":"..."}, ...]
 *
 * Usage:
 *   OPENAI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/regenerate-meanings.mjs --candidates /tmp/meaning-candidates.json --dry-run --limit 20
 *   OPENAI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/regenerate-meanings.mjs --candidates /tmp/meaning-candidates.json --limit 100
 *
 * Secret は memory ルールに従い gcloud secrets から都度供給:
 *   OPENAI_API_KEY=$(gcloud secrets versions access latest --secret=OPENAI_API_KEY) \
 *   SUPABASE_SERVICE_ROLE_KEY=$(gcloud secrets versions access latest --secret=SUPABASE_SERVICE_ROLE_KEY) \
 *     node scripts/regenerate-meanings.mjs --candidates /tmp/meaning-candidates.json --dry-run --limit 20
 */

import { readFileSync, writeFileSync } from 'node:fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ybfdlsjuscgspkcgwist.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_TEXT_MODEL ?? 'gpt-4.1-mini'
const CHUNK_SIZE = 12

if (!SUPABASE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY が必要')
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY が必要')
  process.exit(1)
}

const args = process.argv.slice(2)
const argOf = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }
const dryRun = args.includes('--dry-run')
const limit = parseInt(argOf('--limit') ?? '20', 10)
const outFile = argOf('--out') ?? '/tmp/regen-meanings-dryrun.json'
const candidatesFile = argOf('--candidates')
if (!candidatesFile) {
  console.error('--candidates FILE が必要 (Supabase MCP で事前生成した JSON)')
  process.exit(1)
}

const PG_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function pgSelectPayload(wordId) {
  const url = `${SUPABASE_URL}/rest/v1/dictionary_cache?word_id=eq.${wordId}&select=payload&limit=1`
  const res = await fetch(url, { headers: PG_HEADERS })
  if (!res.ok) throw new Error(`SELECT ${res.status}: ${await res.text()}`)
  const rows = await res.json()
  return rows?.[0]?.payload ?? null
}

async function pgUpdatePayload(wordId, payload) {
  const url = `${SUPABASE_URL}/rest/v1/dictionary_cache?word_id=eq.${wordId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...PG_HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ payload }),
  })
  if (!res.ok) throw new Error(`UPDATE ${res.status}: ${await res.text()}`)
}

// ── OpenAI 呼び出し (rewriteDictionaryAI.ts と同じプロンプト) ──
function buildSenseTranslationPrompt(items) {
  return [
    'You are generating Japanese dictionary content for a British English learning app for Japanese learners.',
    '',
    'Your job is to produce for each item:',
    '- definitionJa: a short Japanese dictionary gloss',
    '- exampleJa: null (we are only regenerating meanings; return null always)',
    '',
    'This is NOT free paraphrasing.',
    'This is NOT a long explanation.',
    'Write concise, dictionary-style Japanese.',
    '',
    'Rules for definitionJa:',
    '- Use the partOfSpeech field only to guide the style of the gloss — do NOT include part of speech labels in the output.',
    '- Do NOT append part of speech labels like （動詞）、（名詞）、（形容詞） to the definitionJa.',
    '- verb -> use a concise Japanese verb ending in 〜する or 〜だ.',
    '- noun -> use a Japanese noun gloss. If a standard single Japanese word exists, use it.',
    '- adjective -> use a natural Japanese adjective ending in 〜な or 〜的な or 〜の. NEVER paraphrase with 〜に関係する or 〜に関する.',
    '- adverb -> use a Japanese adverb ending in 〜に / 〜として / 〜的に. NEVER end in 〜様子 / 〜な様子 / 〜な感じ (those describe a noun, not an adverb).',
    "  e.g. 'blamelessly' adverb -> とがめられずに  (NOT 非難されない様子)",
    "  e.g. 'bilaterally' adverb -> 両側で  (NOT 両側に関係する様子)",
    "  e.g. 'parentally' adverb -> 親として  (NOT 親に関する様子)",
    '- Keep it short and dictionary-like. Aim for 10 Japanese characters or fewer. HARD LIMIT 15 characters — if you exceed, you are describing instead of glossing.',
    '- ALWAYS prefer a standard Japanese dictionary word over a descriptive phrase.',
    "  e.g. 'currency' noun -> 通貨  (NOT ある国で使われるお金)",
    "  e.g. 'monopoly' noun -> 独占  (NOT 製品やサービスの供給を完全に支配すること)",
    "  e.g. 'projectile' noun -> 飛射体  (NOT 空中に飛ばされる物体)",
    "  e.g. 'literal' adjective -> 文字通りの  (NOT 比喩なしに理解すること)",
    "  e.g. 'subjective' adjective -> 主観的な  (NOT 主語として使われる名詞の形を示す)",
    "  e.g. 'invisible' adjective -> 目に見えない  (NOT 物理的な商品でないサービスに関する)",
    '- For concrete objects (instruments, chemicals, materials, devices, foods, animals, plants, tools): use the STANDARD Japanese word (loanword or 漢語). NEVER describe the object.',
    "  e.g. 'saxophone' noun -> サックス  (NOT クラリネットのようなリードを使う金属製の管楽器)",
    "  e.g. 'hydrogen' noun -> 水素  (NOT 無色無臭で燃えやすい気体の元素)",
    "  e.g. 'engine' noun -> エンジン  (NOT 動力機械)",
    "  e.g. 'antibiotic' noun -> 抗生物質  (NOT 病気を起こす微生物を止めたり殺したりする薬)",
    '- For abstract state nouns: use a single 漢語 gloss. NEVER describe as 〜な状態/〜な性質/〜な様子/〜な感じ/〜な特徴.',
    "  e.g. 'welfare' noun -> 福祉  (NOT 健康で幸福な状態)",
    "  e.g. 'normality' noun -> 正常  (NOT 通常の状態)",
    "  e.g. 'exposure' noun -> 露出  (NOT 無防備な状態)",
    "  e.g. 'confinement' noun -> 監禁  (NOT 制限された状態)",
    "  e.g. 'stateliness' noun -> 威厳  (NOT 堂々とした様子)",
    "  e.g. 'impeccability' noun -> 無欠  (NOT 欠点のない状態)",
    '- For action nouns: use a single 漢語 gloss. NEVER describe as 〜行為/〜行動/〜作用.',
    "  e.g. 'correction' noun -> 訂正  (NOT 誤りを直す行為)",
    "  e.g. 'erosion' noun -> 浸食  (NOT 風化作用)",
    "  e.g. 'decorum' noun -> 礼儀作法  (NOT 礼儀正しい行動)",
    '- For agent/instrument nouns ending in -er/-or/-ent: use a single Japanese noun. NEVER describe as 〜もの/〜する人や機械/〜する道具.',
    "  e.g. 'incentive' noun -> 動機  (NOT やる気を起こさせるもの)",
    "  e.g. 'obstructor' noun -> 妨害者  (NOT 妨げるもの)",
    "  e.g. 'retractor' noun -> 開創器  (NOT 引き戻す道具)",
    '- Do NOT write explanatory phrases like 「〜に関係する」「〜に関する」「〜に関連する」.',
    '- Do NOT use endings like:',
    '  - 「〜すること」',
    '  - 「〜できること」',
    '  - 「〜なこと」',
    '  - 「〜であること」',
    '  - 「〜として使われる」',
    '  - 「〜に使われる」',
    '  - 「〜に使用される」',
    '  - 「〜な状態」「〜の状態」',
    '  - 「〜な性質」「〜の性質」',
    '  - 「〜な様子」「〜の様子」',
    '  - 「〜な感じ」',
    '  - 「〜な特徴」',
    '  - 「〜行為」「〜行動」「〜作用」',
    '  - 「〜もの」「〜する人や機械」「〜する道具」',
    '- unless the source sense itself is explicitly an abstract noun sense AND no single Japanese word fits.',
    '- Prefer the most standard learner-dictionary Japanese gloss.',
    "  e.g. 'competitive' adjective -> 競争的な  (NOT 他より優れようとすることに関係する)",
    "  e.g. 'transparent' adjective -> 透明な  (NOT 光を通すことに関係する)",
    '- Use the example only to disambiguate the sense.',
    '',
    'Rules for exampleJa:',
    '- Return null. We are only regenerating meanings this run.',
    '',
    'Return JSON only.',
    'Output format: {"items":[{"id":"...","definitionJa":"...","exampleJa":null}]}',
    '',
    'Input:',
    JSON.stringify(items),
  ].join('\n')
}

function stripCodeFence(text) {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
}

async function callOpenAI(items) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You translate learner-friendly English dictionary content into concise natural Japanese. The headword field tells you which word is being defined — use it to disambiguate domain-specific or polysemous terms. Return JSON only.',
        },
        { role: 'user', content: buildSenseTranslationPrompt(items) },
      ],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI empty content')
  const parsed = JSON.parse(stripCodeFence(content))
  if (!Array.isArray(parsed.items)) throw new Error('OpenAI invalid items')
  const map = new Map()
  for (const item of parsed.items) {
    if (item?.id && typeof item.definitionJa === 'string' && item.definitionJa.trim()) {
      map.set(item.id, item.definitionJa.trim())
    }
  }
  return map
}

function chunk(items, size) {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

// ── payload 差し替え ─────────────────────────────
async function regenerateForWord(row) {
  const { word, id: wordId, payload } = row

  const sources = []
  for (const group of payload?.senseGroups ?? []) {
    for (const sense of group?.senses ?? []) {
      const defEn = (sense?.definition ?? '').trim()
      if (!defEn || !sense?.senseId) continue
      sources.push({
        id: sense.senseId,
        headword: word,
        partOfSpeech: group.partOfSpeech,
        definitionEn: defEn,
        exampleEn: sense.example ?? null,
      })
    }
  }
  if (sources.length === 0) return { word, skipped: 'no-senses', before: {}, after: {} }

  const translated = new Map()
  for (const grp of chunk(sources, CHUNK_SIZE)) {
    const partial = await callOpenAI(grp)
    for (const [id, ja] of partial) translated.set(id, ja)
  }

  const before = {}
  const after = {}
  const jaSenses = payload?.locales?.ja?.senses ?? {}
  for (const src of sources) {
    before[src.id] = jaSenses[src.id]?.meaning ?? null
    const newJa = translated.get(src.id)
    if (newJa) after[src.id] = newJa
  }

  return { word, wordId, before, after, sources }
}

async function applyToDb(wordId, payload, after) {
  const next = JSON.parse(JSON.stringify(payload))
  if (!next.locales) next.locales = {}
  if (!next.locales.ja) next.locales.ja = { senses: {}, etymology: null, registerLabels: {} }
  if (!next.locales.ja.senses) next.locales.ja.senses = {}
  for (const [senseId, meaning] of Object.entries(after)) {
    const cur = next.locales.ja.senses[senseId] ?? { meaning: '', exampleTranslation: null, grammarTags: [] }
    next.locales.ja.senses[senseId] = { ...cur, meaning }
  }
  await pgUpdatePayload(wordId, next)
}

// ── 対象抽出 ─────────────────────────────────────
async function loadCandidatesAndFetchPayloads() {
  const raw = readFileSync(candidatesFile, 'utf8')
  const list = JSON.parse(raw)
  if (!Array.isArray(list)) throw new Error('candidates file must be a JSON array')
  console.log(`候補ファイル読み込み: ${list.length} words`)
  const target = list.slice(0, limit)
  const rows = []
  for (const c of target) {
    if (!c?.id || !c?.word) continue
    try {
      const payload = await pgSelectPayload(c.id)
      if (!payload) { console.log(`skip ${c.word}: no payload`); continue }
      rows.push({ id: c.id, word: c.word, payload })
    } catch (e) {
      console.log(`skip ${c.word}: ${e.message}`)
    }
  }
  return rows
}

async function main() {
  const target = await loadCandidatesAndFetchPayloads()
  console.log(`処理対象: ${target.length} words (dry-run=${dryRun})`)

  const results = []
  for (let i = 0; i < target.length; i++) {
    const row = target[i]
    process.stdout.write(`[${i + 1}/${target.length}] ${row.word} ... `)
    try {
      const r = await regenerateForWord(row)
      results.push(r)
      if (!dryRun) {
        await applyToDb(row.id, row.payload, r.after)
      }
      console.log('ok')
    } catch (e) {
      console.log('ERR', e.message)
      results.push({ word: row.word, error: e.message })
    }
    // OpenAI rate limit 余裕: 500ms 間隔
    await new Promise((r) => setTimeout(r, 500))
  }

  if (dryRun) {
    writeFileSync(outFile, JSON.stringify(results, null, 2))
    console.log(`\nDry-run 完了: ${outFile}`)
    console.log('\n=== First-sense before → after ===')
    for (const r of results) {
      if (r.error) { console.log(`${r.word}: ERR ${r.error}`); continue }
      const firstSrc = r.sources?.[0]
      if (!firstSrc) continue
      const before = r.before?.[firstSrc.id] ?? '(null)'
      const after = r.after?.[firstSrc.id] ?? '(null)'
      console.log(`${r.word.padEnd(20)} ${before}  →  ${after}`)
    }
  } else {
    console.log(`\n本番書き込み完了: ${results.filter((r) => !r.error).length} / ${results.length}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
