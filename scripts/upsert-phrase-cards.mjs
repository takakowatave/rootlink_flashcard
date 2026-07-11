#!/usr/bin/env node
/**
 * upsert-phrase-cards.mjs
 *
 * phrase_cards 一括生成/上書きスクリプト。
 *
 * 使い方:
 *   1. 既存67件を再生成:
 *        node --env-file=.env.local scripts/upsert-phrase-cards.mjs
 *   2. 新規追加:
 *        node --env-file=.env.local scripts/upsert-phrase-cards.mjs path/to/phrases.txt
 *      （1行1フレーズ。空行と # から始まる行は無視）
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

const SYSTEM_PROMPT = `あなたは英語辞書の編纂者です。与えられた英語表現1件について、辞書エントリーとしてどのユーザーが見ても意味・使い方が理解できる中立的で自然な内容をJSONで返してください。

出力形式:
{
  "phrase": string,          // 表現そのまま。型注釈や括弧内注記は含めない
  "meaning_ja": string,      // 日本語の意味（簡潔に。〜する／〜のこと）
  "meaning_en": string,      // 英語の意味（英英辞書風に簡潔）
  "explanation_ja": string,  // 補足説明・使いどころ（日本語）
  "explanation_en": string,  // 補足説明・使いどころ（英語）
  "example_en": string,      // 自然な英語例文（1つ）
  "example_ja": string,      // 例文の日本語訳
  "type": string,            // 下記から必ず選択
  "locale": string | null,   // 通常 null。英国/米国固有の場合のみ 'en-GB' / 'en-US'
  "register": string         // 'neutral' / 'formal' / 'informal' / 'slang' / 'archaic' / 'vulgar'
}

type の選択肢:
- idiom: 非合成・意味固定・構文生成不可（意味を直訳できない）
- phrasal_verb: 動詞＋副詞／前置詞の定型表現
- fixed_expression: 意味は推測可能だが言い回しが固定
- spoken_expression: 会話機能語（相槌・反応・つなぎ）
- collocation: 意味は合成可能だが自然な語の組み合わせ
- pattern: 差し替え可能な構文テンプレート（〜 one's brains など）
- expression: 上記に当てはまらない一般的な表現

locale の決め方:
- 原則 null（英米で共通に使われる表現）
- 英国・オーストラリア・アイルランド固有 → 'en-GB'
- アメリカ固有 → 'en-US'
- 迷ったら null

register:
- 原則 neutral。明らかにフォーマル・カジュアル・スラング等の場合のみ変更

品質基準:
- 中立・辞書的。個人の感想や主観を避ける
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
  const TYPES = ['idiom', 'phrasal_verb', 'fixed_expression', 'spoken_expression', 'collocation', 'pattern', 'expression', 'slang']
  const REGISTERS = ['neutral', 'informal', 'slang', 'formal', 'archaic', 'vulgar']
  const LOCALES = ['en-GB', 'en-US']
  if (!TYPES.includes(p.type)) throw new Error(`invalid type: ${p.type}`)
  if (!REGISTERS.includes(p.register)) throw new Error(`invalid register: ${p.register}`)
  if (p.locale != null && !LOCALES.includes(p.locale)) throw new Error(`invalid locale: ${p.locale}`)
}

async function loadPhrases() {
  const arg = process.argv[2]
  if (arg) {
    const text = readFileSync(arg, 'utf-8')
    const phrases = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    return phrases.map(phrase => ({ phrase, id: null }))
  }
  const { data, error } = await supabase.from('phrase_cards').select('id, phrase').order('created_at')
  if (error) throw error
  return data
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
  const rows = await loadPhrases()
  console.log(`Processing ${rows.length} phrases...`)
  let ok = 0
  const failures = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const label = `[${i + 1}/${rows.length}] ${row.phrase}`
    try {
      const payload = await generatePayload(row.phrase)
      validate(payload)
      await upsertRow(row, payload)
      ok++
      console.log(`OK   ${label}`)
    } catch (e) {
      failures.push({ phrase: row.phrase, error: e.message })
      console.error(`FAIL ${label}: ${e.message}`)
    }
  }
  console.log(`\nDone. success=${ok}, failed=${failures.length}`)
  if (failures.length) {
    console.log('Failures:')
    failures.forEach(f => console.log(`  - ${f.phrase}: ${f.error}`))
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
