// lib/typoClassifier.ts

/*
  typoClassifier

  責務：
  - 検索入力が「辞書の正規エントリとして生成してよいか」を“軽量に”判定する
  - 明らかに誤字・崩れた入力はここで止める（= 生成しない）
  - 誤字の可能性が高い場合は候補を最大2つ返す
  - 意味生成は絶対にしない

  やらないこと：
  - 意味/例文/語源の生成
  - 実在性の最終保証（必要なら次のレイヤへ）
*/

import { apiRequest } from '@/lib/apiClient'

export type TypoResult =
  | { kind: 'BLOCK'; candidates?: string[]; reason: 'TYPO' | 'GIBBERISH' | 'NON_ENTRY' }
  | { kind: 'OK' }
  | { kind: 'UNCERTAIN' }

type TypoClassifierResponse = {
  decision: 'OK' | 'BLOCK' | 'UNCERTAIN'
  reason?: 'TYPO' | 'GIBBERISH' | 'NON_ENTRY'
  candidates?: string[]
  confidence: 'high' | 'medium' | 'low'
}

export async function classifyTypo(input: string): Promise<TypoResult> {
  const normalized = input.trim().toLowerCase()
  if (normalized.length < 3) return { kind: 'UNCERTAIN' }

  const prompt = `
You are a strict "dictionary entry gate" for English search queries.

Goal:
Decide whether the input should be allowed to proceed to dictionary entry generation.

Rules:
- Do NOT explain meanings.
- Do NOT generate definitions or examples.
- Only decide the gate decision.
- Be strict: if any token looks like a misspelling of a common word, BLOCK.
- If you BLOCK, you may suggest up to 2 corrected candidates (common expressions only).
- If you cannot decide confidently, return UNCERTAIN (do not guess).

Judgment hints:
- Repeated letters, minor edit distance, or unnatural tokens -> likely typo.
- If input contains a token that is not a plausible English word (e.g. "headds"), BLOCK.
- If input is a valid but unusual phrase and you are unsure, UNCERTAIN.

Output JSON only with this schema:
{
  "decision": "OK" | "BLOCK" | "UNCERTAIN",
  "confidence": "high" | "medium" | "low",
  "reason": "TYPO" | "GIBBERISH" | "NON_ENTRY",
  "candidates": ["..."] // optional, max 2
}

Input: "${normalized}"
`

  let res: TypoClassifierResponse
  try {
    res = await apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })
  } catch {
    return { kind: 'UNCERTAIN' }
  }

  if (res.decision === 'BLOCK' && res.confidence !== 'low') {
    const candidates =
      Array.isArray(res.candidates) && res.candidates.length > 0
        ? res.candidates.slice(0, 2)
        : undefined

    return {
      kind: 'BLOCK',
      reason: res.reason ?? 'NON_ENTRY',
      candidates,
    }
  }

  if (res.decision === 'OK' && res.confidence === 'high') {
    return { kind: 'OK' }
  }

  return { kind: 'UNCERTAIN' }
}
