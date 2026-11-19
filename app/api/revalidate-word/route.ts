import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * `/word/[word]` の ISR キャッシュを明示的に purge する。
 *
 * 呼び出し元: Header / SearchBox / MobileSearchOverlay の検索成功後、
 * 遷移直前にクライアントから叩く。以前は `?fresh=1` で SSR を dynamic 化して
 * Data Cache を bypass していたが、ページ全体を ISR に変えたので
 * cache の方を invalidate する方式に差し替えた。
 *
 * 事情:
 * - 直前に /resolve が走って dictionary_cache を埋めたばかりなので、
 *   次に HTML を取るタイミングでは最新の辞書を読ませたい。
 * - revalidatePath() は該当パスの Full Route Cache と Data Cache を purge する。
 *   次アクセスで SSR 1 回だけ走り、その後は再キャッシュ。
 * - 公開エンドポイントだが、受け取るのは語の文字列だけで DB には触らない。
 *   語の正規表現と長さで弾き、万一 bot に叩かれても revalidate が増えるだけ。
 */

const WORD_RE = /^[a-zA-Z0-9][a-zA-Z0-9 _'-]{0,99}$/

export async function POST(req: Request) {
  let body: { word?: unknown } = {}
  try { body = await req.json() } catch { body = {} }
  const word = typeof body.word === 'string' ? body.word.trim() : ''
  if (!word || !WORD_RE.test(word)) {
    return NextResponse.json({ ok: false, error: 'invalid word' }, { status: 400 })
  }
  const path = `/word/${encodeURIComponent(word.replace(/\s+/g, '_'))}`
  revalidatePath(path)
  return NextResponse.json({ ok: true, path })
}
