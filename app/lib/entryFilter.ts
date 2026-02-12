/*
  entryFilter.ts

  このファイルは
  「入力としては成立しているが、
   辞書の正規エントリとして生成すると事故るもの」
  を検出するための共通フィルタ。

  - 検索は止めない
  - 生成・確定だけを止める
  - 単語 / 熟語 共通
*/

/*
  entryFilter.ts

  役割：
  - 検索語は止めない
  - 辞書として「確定・生成してよい正規語」を決める
  - typo はエラーにせず、正規語に寄せる

  入力:
    ユーザーが検索した生の語

  出力:
    - ok: true  → この normalized を辞書エントリとして生成する
    - ok: false → 生成はしない（検索体験側で扱う）
*/

export type EntryFilterResult =
  | {
      ok: true
      normalized: string
      correctedFrom?: string
    }
  | {
      ok: false
      reason:
        | 'NOISE'
        | 'PROPER_NOUN'
        | 'NON_ENGLISH'
        | 'UNSAFE_TO_GENERATE'
      note?: string
    }

export async function entryFilter(
  input: string
): Promise<EntryFilterResult> {
  const raw = input.trim()
  const normalized = raw.toLowerCase()

  /* =========================
     ① 明らかなノイズ語
  ========================= */
  if (
    /^[a-z]{5,}$/.test(normalized) &&
    new Set(normalized).size <= 2
  ) {
    return {
      ok: false,
      reason: 'NOISE',
      note: 'repetitive or meaningless string',
    }
  }

  /* =========================
     ② 固有名詞（最低限）
  ========================= */
  const properNouns = ['chatgpt', 'google']
  if (properNouns.includes(normalized)) {
    return {
      ok: false,
      reason: 'PROPER_NOUN',
      note: 'proper noun or product name',
    }
  }

  /* =========================
     ③ 非英語っぽいもの
  ========================= */
  if (/\b(raison|etre|d[’']etre)\b/.test(normalized)) {
    return {
      ok: false,
      reason: 'NON_ENGLISH',
      note: 'likely non-English expression',
    }
  }

  /* =========================
     ⑤ 正規エントリとして生成OK
  ========================= */
  return {
    ok: true,
    normalized,
  }
}

/* --------------------------------
   AI typo correction（1語だけ）
-------------------------------- */
async function aiSuggestCorrection(
  input: string
): Promise<string | null> {
  // 擬似実装
  // 実際は LLM / spell API
  if (input === 'takke over') return 'take over'
  return null
}
