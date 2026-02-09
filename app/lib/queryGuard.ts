/*
  queryGuard.ts

  このファイルは「検索入力として成立するかどうか」を判定する
  **最初の・最も軽いフィルタ**です。

  重要な前提：
  - ここでやるのは「入力として危険かどうか」の判定だけ
  - 英語として正しいか／意味があるか／生成してよいかは判断しない
  - LLM・辞書・生成ロジックには関与しない

  この関数の戻り値は、呼び出し側で次のように使われる前提です：

    const result = await guardQuery(...)
    if (!result.ok) {
      // 処理をここで止める
      return
    }

  つまりこのファイルに書いてよい判定は：
  - 「ここで処理を止めてもUXが破綻しないもの」に限られます。
*/

export type QueryGuardError =
  | 'NON_ALPHABET' // アルファベット・スペース・ハイフン以外を含む
  | 'TOO_LONG'     // 空文字、または想定より長すぎる入力
  | 'MISSPELLING'  // 明らかなスペルミス（正規エントリとして通さない）

export type QueryGuardResult =
  | {
      ok: true
      normalized: string
    }
  | {
      ok: false
      reason: QueryGuardError
      suggestion?: string
    }

/*
  guardQuery

  - ユーザーの生入力を受け取り、最低限の正規化を行う
  - 「この入力を正規ルートに通してよいか」を判定する
  - ok: false を返した場合、呼び出し側では処理を中断する想定

  注意：
  - MISSPELLING は「英語として存在しない」という意味ではない
  - あくまで「正規エントリとして生成してはいけない」ことを示す
  - suggestion は UI 側で補助的に使われることを想定している
*/
export async function guardQuery(
  raw: string,
  maxLength: number
): Promise<QueryGuardResult> {
  // 前後の空白を除去し、小文字に正規化
  const q = raw.trim().toLowerCase()

  // ① アルファベット・スペース・ハイフン以外を弾く
  //    入力として成立しないため、即座に処理を止めてよい
  if (!/^[a-z\s-]+$/.test(q)) {
    return { ok: false, reason: 'NON_ALPHABET' }
  }

  // ② 文字数制限（空文字も弾く）
  //    UX的にこれ以上進める意味がないため、処理を止める
  if (q.length === 0 || q.length > maxLength) {
    return { ok: false, reason: 'TOO_LONG' }
  }

  /*
    ③ スペルミス簡易ガード

    - 同一文字の過剰な連続（takkke / cooool など）
    - 人為的 typo を「正規語として確定させない」ための判定
    - 意味推定・辞書照合・生成は一切行わない

    ※ ここで ok:false を返すことで、
       「正規ルート（生成・保存）」には進ませない。
       ただし suggestion を通じて UI 側での補助表示は可能。
  */
  if (/(.)\1{2,}/.test(q)) {
    return {
      ok: false,
      reason: 'MISSPELLING',
      // UI で「もしかして？」表示などに使う想定
      suggestion: q.replace(/(.)\1+/g, '$1')
    }
  }

  // ④ ここを通ったものだけが「正規ルート」に進める
  //    この時点では、英語として正しいかどうかはまだ保証しない
  return { ok: true, normalized: q }
}
