#!/usr/bin/env node
/**
 * upsert-phrase-cards.mjs
 *
 * phrase_cards 一括生成/上書き＋クレンズスクリプト。
 * spec: scripts/phrase-cards-prompt.md（Notion「フレーズ」ページが真の spec）
 *
 * 使い方:
 *   1. 既存全件を spec で再生成（skip判定は削除せずログのみ・要人手確認）:
 *        node --env-file=.env.local scripts/upsert-phrase-cards.mjs
 *   2. 既存全件を spec でクレンズ（skip判定を即削除する。破壊的）:
 *        node --env-file=.env.local scripts/upsert-phrase-cards.mjs --delete-skips
 *   3. 新規追加（テキストファイル、1行1フレーズ。空行と # は無視）:
 *        node --env-file=.env.local scripts/upsert-phrase-cards.mjs path/to/phrases.txt
 *
 * skip 判定は spec の Step 1 gate（NG1〜NG6）で行う。gate 落ちしたら:
 *   - 既存行かつ --delete-skips: DELETE
 *   - 既存行かつ通常モード: そのまま放置（skipログ出力）
 *   - 新規行: INSERT しない（skipログ出力）
 *
 * 必要な環境変数（.env.local に追加）:
 *   OPENAI_API_KEY
 *   SUPABASE_URL または NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env: OPENAI_API_KEY / SUPABASE_URL(_or_NEXT_PUBLIC_) / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const SYSTEM_PROMPT = `あなたは英語辞書の編纂者です。入力された英語表現1件について、次の順に処理してください。

# Step 1: 判定 gate

主要な英英辞書（Oxford / Longman / Cambridge）が、この phrase を独立エントリー、熟語見出し、または usage note として立てるか。
- YES → Step 2 (JSON生成) に進む
- NO → skip 出力
- 迷ったら NO

## NGパターン（1つでも該当したら即 skip）

NG1. 冠詞つきの塊: a / an / the から始まる（辞書見出しには冠詞は付かない）
  例: a good idea, an important decision, the recent report

NG2. エッセイ文脈依存: 具体トピック語（固有名詞・限定的な名詞）と一般動詞の組み合わせで、その文脈を離れると成立しない

NG3. 動詞 + someone / something だけ: 一般的な他動詞に目的語 slot を付けただけの塊は word entry の範疇
  例: see someone, hit someone, help someone

NG4. 基本文法パターン: 使役・知覚動詞などの SVOC 構造は grammar note の範疇であって、独立した辞書項目ではない
  例: make sb do sth, let sb go, have sb do sth
  例外: verb + to-inf の usage note (agree to do sth, succeed in doing sth など) は主要辞書に立つ → OK

NG5. 字義通りの形容詞 + 名詞: 慣用性がゼロの、単なる合成的意味の組み合わせ
  例: red car, interesting book, big house

NG6. 文まるごと: 文単位ではなく辞書粒度で立てる。文の中に慣用性のある塊があれば、その部分だけ抽出
  例: You did a great job. → 慣用性のある do a great job を抽出

# Step 2: type 判定ルール（gate 合格時、優先順位順）

以下の順に該当するか見て、最初にYESの type を採用する:
1. idiom — 意味が字義から復元できない（比喩・慣用）。slot があっても意味非合成なら idiom
2. phrasal_verb — 動詞 + 副詞/前置詞のセット
3. pattern — 差し替え可能な構文の枠が固定（... / doing / to do の slot）
4. fixed_expression — 語順固定で意味は合成的
5. collocation — 自然な組み合わせだが差し替えも可能
6. slang — スラングとして辞書に載っているもののみ

廃止済み type（絶対に使わない）:
- spoken_expression → fixed_expression に統合
- expression → 廃止

# 出力形式

## Case A. skip（gate 不合格）
{
  "skip": true,
  "reason": "NG1: 冠詞つき名詞句"
}
- reason は該当した NG 番号 + 短い説明
- 複数該当したら最も強い理由1つを書く

## Case B. accepted（gate 合格）
{
  "phrase": string,          // 表現そのまま。型注釈や括弧内注記は含めない
  "meaning_ja": string,      // 日本語の意味（簡潔に。〜する／〜のこと）
  "meaning_en": string,      // 英語の意味（英英辞書風に簡潔）
  "explanation_ja": string,  // 補足説明・使いどころ（日本語）
  "explanation_en": string,  // 補足説明・使いどころ（英語）
  "example_en": string,      // 自然な英語例文（1つ）※必ず phrase を含む
  "example_ja": string,      // 例文の日本語訳
  "type": string,            // Step 2 の優先順位で決めた1つ
  "locale": string | null,   // 通常 null。英国/米国固有の場合のみ 'en-GB' / 'en-US'
  "register": string         // 'neutral' / 'formal' / 'informal' / 'slang' / 'archaic' / 'vulgar'
}

# locale の決め方
- 原則 null（英米で共通に使われる表現）
- 英国・オーストラリア・アイルランド固有 → 'en-GB'
- アメリカ固有 → 'en-US'
- 迷ったら null

# register の決め方
- 原則 neutral。明らかにフォーマル・カジュアル・スラング等の場合のみ変更

# 品質基準
- 中立・辞書的。個人の感想や主観を避ける
- 例文は必ず phrase を含む（見出しと例文が乖離しない）
- 例文は自然で文脈が明確
- meaning_ja は短く端的に
- 日本語訳は自然な日本語（直訳調を避ける）
- JSON以外の文字（前置き・コードフェンス）は出力しない`

async function generatePayload(phrase) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `表現: ${phrase}` },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI ${res.status}: ${body}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI: empty response')
  return JSON.parse(content)
}

function validate(p) {
  const TYPES = ['idiom', 'phrasal_verb', 'fixed_expression', 'collocation', 'pattern', 'slang']
  const REGISTERS = ['neutral', 'informal', 'slang', 'formal', 'archaic', 'vulgar']
  const LOCALES = ['en-GB', 'en-US']
  if (!TYPES.includes(p.type)) throw new Error(`invalid type: ${p.type}`)
  if (!REGISTERS.includes(p.register)) throw new Error(`invalid register: ${p.register}`)
  if (p.locale != null && !LOCALES.includes(p.locale)) throw new Error(`invalid locale: ${p.locale}`)
  const stripped = String(p.phrase ?? '').replace(/\s*\([^)]*\)/g, '').trim()
  if (!/\S\s+\S/.test(stripped)) throw new Error(`phrase must be multi-word: ${p.phrase}`)
  const example = String(p.example_en ?? '').toLowerCase()
  const head = stripped.toLowerCase().split(/\s+/).slice(0, 2).join(' ')
  if (head && !example.includes(head)) {
    throw new Error(`example_en must contain phrase head "${head}": ${p.example_en}`)
  }
}

function parseArgs() {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter(a => a.startsWith('--')))
  const positional = args.filter(a => !a.startsWith('--'))
  return {
    deleteSkips: flags.has('--delete-skips'),
    inputFile: positional[0] ?? null,
  }
}

async function loadPhrases(inputFile) {
  if (inputFile) {
    const text = readFileSync(inputFile, 'utf-8')
    const phrases = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    return phrases.map(phrase => ({ phrase, id: null }))
  }
  const { data, error } = await supabase.from('phrase_cards').select('id, phrase').order('created_at')
  if (error) throw error
  return data
}

async function deleteRow(id) {
  const { error } = await supabase.from('phrase_cards').delete().eq('id', id)
  if (error) throw error
}

async function upsertRow(row, payload) {
  const record = {
    phrase: row.phrase,
    meaning_ja: payload.meaning_ja ?? null,
    meaning_en: payload.meaning_en ?? null,
    explanation_ja: payload.explanation_ja ?? null,
    explanation_en: payload.explanation_en ?? null,
    example_en: payload.example_en ?? null,
    example_ja: payload.example_ja ?? null,
    type: payload.type,
    locale: payload.locale ?? null,
    register: payload.register ?? 'neutral',
  }
  if (row.id) {
    const { error } = await supabase.from('phrase_cards').update(record).eq('id', row.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('phrase_cards').insert(record)
    if (error) throw error
  }
}

async function main() {
  const { deleteSkips, inputFile } = parseArgs()
  const rows = await loadPhrases(inputFile)
  console.log(`Processing ${rows.length} phrases... (deleteSkips=${deleteSkips})`)
  let ok = 0
  let deleted = 0
  const skipped = []
  const failures = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const label = `[${i + 1}/${rows.length}] ${row.phrase}`
    try {
      const payload = await generatePayload(row.phrase)
      if (payload?.skip === true) {
        const reason = payload.reason ?? '(no reason)'
        skipped.push({ phrase: row.phrase, reason, id: row.id })
        if (deleteSkips && row.id) {
          await deleteRow(row.id)
          deleted++
          console.log(`DEL  ${label}: ${reason}`)
        } else {
          console.log(`SKIP ${label}: ${reason}`)
        }
        continue
      }
      validate(payload)
      await upsertRow(row, payload)
      ok++
      console.log(`OK   ${label}`)
    } catch (e) {
      failures.push({ phrase: row.phrase, error: e.message })
      console.error(`FAIL ${label}: ${e.message}`)
    }
  }
  console.log(`\nDone. success=${ok}, skipped=${skipped.length}, deleted=${deleted}, failed=${failures.length}`)
  if (skipped.length) {
    console.log('Skipped (gate rejected):')
    skipped.forEach(s => console.log(`  - ${s.phrase}: ${s.reason}`))
  }
  if (failures.length) {
    console.log('Failures:')
    failures.forEach(f => console.log(`  - ${f.phrase}: ${f.error}`))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
