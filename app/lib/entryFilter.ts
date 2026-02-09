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

export type EntryFilterResult =
  | {
      ok: true
      normalized: string
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

export function entryFilter(input: string): EntryFilterResult {
  const normalized = input.trim().toLowerCase()

  /*
    ① 明らかなノイズ語
    - asdfgh
    - aaaaa
  */
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

  /*
    ② 人名・プロダクト名（代表的なもののみ）
    ※ 将来 whitelist / blacklist に拡張可能
  */
  const properNouns = ['chatgpt', 'google']
  if (properNouns.includes(normalized)) {
    return {
      ok: false,
      reason: 'PROPER_NOUN',
      note: 'proper noun or product name',
    }
  }

  /*
    ③ 他言語っぽいもの（英語として意味を立てると危険）
    - raison detre など
    ※ 完全判定はしない。事故りやすい形だけ拾う
  */
  if (
    /\b(raison|etre|d[’']etre)\b/.test(normalized)
  ) {
    return {
      ok: false,
      reason: 'NON_ENGLISH',
      note: 'likely non-English expression',
    }
  }

/*
  ④ typo 由来の造語 / 無理な分解が必要なもの
*/
if (/(.)\1+/.test(normalized)) {
    return {
      ok: false,
      reason: 'UNSAFE_TO_GENERATE',
      note: 'likely typo-derived expression',
    }
  }
  

  // 正規エントリとして生成してよい
  return { ok: true, normalized }
}
