import { NextResponse } from 'next/server'
import { checkAdminServer } from '@/lib/adminAuth'

// Cuppa English 長尺動画用ナレーション生成。
// - フロント側で admin (ADMIN_EMAILS / fallback kiko) を検証
// - OpenAI key は Cloud Run (rootlink_server) にしか無いので proxy する
// - 共有秘密 NARRATION_PROXY_SECRET を Authorization: Bearer で渡す
// - 予算ガード (tts_daily_counters.kind='narration') は Cloud Run 側で実施

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const admin = await checkAdminServer()
  if (!admin.ok) {
    return NextResponse.json(
      { ok: false, reason: admin.reason },
      { status: admin.reason === 'UNAUTHENTICATED' ? 401 : 403 },
    )
  }

  const cloudrunUrl = process.env.NEXT_PUBLIC_CLOUDRUN_API_URL
  const proxySecret = process.env.NARRATION_PROXY_SECRET
  if (!cloudrunUrl || !proxySecret) {
    return NextResponse.json({ ok: false, reason: 'MISCONFIGURED' }, { status: 500 })
  }

  let bodyText: string
  try {
    bodyText = await req.text()
  } catch {
    return NextResponse.json({ ok: false, reason: 'BAD_JSON' }, { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${cloudrunUrl.replace(/\/$/, '')}/narration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proxySecret}`,
      },
      body: bodyText,
    })
  } catch (e) {
    console.error('narration proxy fetch failed:', e)
    return NextResponse.json({ ok: false, reason: 'UPSTREAM_FETCH_FAILED' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? ''
  if (!upstream.ok) {
    // Cloud Run 側は JSON でエラーを返す
    const text = await upstream.text().catch(() => '')
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: upstream.status })
    } catch {
      return NextResponse.json(
        { ok: false, reason: 'UPSTREAM_ERROR', status: upstream.status, detail: text.slice(0, 300) },
        { status: upstream.status },
      )
    }
  }

  if (!contentType.includes('audio/mpeg')) {
    // 想定外: ok なのに audio/mpeg じゃない
    return NextResponse.json(
      { ok: false, reason: 'UPSTREAM_UNEXPECTED_CONTENT_TYPE', contentType },
      { status: 502 },
    )
  }

  const audioBuf = Buffer.from(await upstream.arrayBuffer())
  return NextResponse.json({
    ok: true,
    audioBase64: audioBuf.toString('base64'),
    mime: 'audio/mpeg',
    bytes: audioBuf.byteLength,
  })
}
