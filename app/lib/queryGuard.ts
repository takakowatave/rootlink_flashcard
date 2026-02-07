export type QueryGuardError =
  | 'NON_ALPHABET'
  | 'TOO_LONG'
  | 'NOT_EXIST'

export type QueryGuardResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: QueryGuardError }

export async function guardQuery(
  raw: string,
  maxLength: number
): Promise<QueryGuardResult> {
  const q = raw.trim().toLowerCase()

  // ① アルファベット・スペース・ハイフン以外を弾く
  if (!/^[a-z\s-]+$/.test(q)) {
    return { ok: false, reason: 'NON_ALPHABET' }
  }

  // ② 文字数制限
  if (q.length === 0 || q.length > maxLength) {
    return { ok: false, reason: 'TOO_LONG' }
  }

  // ③ 存在チェック（暫定：AI / yes-no 専用）
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt: `
Does the following English word or expression exist in standard English usage?
Answer only "yes" or "no".

Input: "${q}"
        `.trim(),
      }),
    }).then((r) => r.text())

    if (!res.toLowerCase().includes('yes')) {
      return { ok: false, reason: 'NOT_EXIST' }
    }
  } catch {
    // ネットワーク / AI失敗時は安全側に倒す
    return { ok: false, reason: 'NOT_EXIST' }
  }

  return { ok: true, normalized: q }
}
