import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

/**
 * デッキの Next.js Data Cache を手動 purge するエンドポイント。
 *
 * 使い方:
 *   # 特定デッキの meta (単語一覧・章一覧) と全章の辞書をまとめて purge
 *   curl -X POST https://www.rootlink.app/api/revalidate/deck \
 *     -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"deckId":"<uuid>"}'
 *
 *   # 全デッキの meta と全章辞書を一気に purge
 *   curl -X POST https://www.rootlink.app/api/revalidate/deck \
 *     -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *     -H "content-type: application/json" -d '{}'
 *
 *   # 特定デッキの、特定章の辞書だけ purge
 *   curl -X POST https://www.rootlink.app/api/revalidate/deck \
 *     -H "x-revalidate-secret: $REVALIDATE_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"deckId":"<uuid>","chapter":3}'
 *
 * 認証: REVALIDATE_SECRET 環境変数と一致するヘッダが必要。
 * 未設定なら 500 を返して常に拒否する (誤って全公開状態にしないため)。
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'REVALIDATE_SECRET is not configured' }, { status: 500 })
  }
  const given = req.headers.get('x-revalidate-secret')
  if (given !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: { deckId?: string; chapter?: number } = {}
  try { body = await req.json() } catch { body = {} }

  const revalidated: string[] = []
  const purge = (tag: string) => { revalidateTag(tag); revalidated.push(tag) }

  if (body.deckId) {
    if (typeof body.chapter === 'number' && Number.isInteger(body.chapter) && body.chapter > 0) {
      purge(`deck-${body.deckId}-ch-${body.chapter}`)
    } else {
      // deck 全体: meta を消せば章画面側でも次回リクエストで meta を再取得する。
      // 章別辞書タグは章番号ごとに個別なのでまとめて消すには全章辞書タグを打つ。
      purge(`deck-${body.deckId}`)
      purge('deck-dictionaries')
    }
  } else {
    // 全デッキ
    purge('deck-words')
    purge('deck-dictionaries')
  }

  return NextResponse.json({ ok: true, revalidated })
}
