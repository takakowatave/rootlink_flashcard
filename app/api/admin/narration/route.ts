import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { checkAdminServer } from '@/lib/adminAuth'

// Cuppa 長尺動画ナレーション: Cloud Run の /audio/narration に proxy するだけ。
// - 多層防御: Vercel 側で先に admin 判定 (403 を速く返す)
// - 本物の認証は Cloud Run 側で Supabase Bearer + ADMIN_EMAILS を見ている
// - OPENAI key は Cloud Run 側にしかない
// - 生成結果は Supabase Storage の公開 URL (audioUrl) を返す

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
  if (!cloudrunUrl) {
    return NextResponse.json({ ok: false, reason: 'MISCONFIGURED' }, { status: 500 })
  }

  // Cloud Run にそのまま回すために、現セッションの access_token を取り出す
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: 'NO_SESSION' }, { status: 401 })
  }

  const bodyText = await req.text()
  let upstream: Response
  try {
    upstream = await fetch(`${cloudrunUrl.replace(/\/$/, '')}/audio/narration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: bodyText,
    })
  } catch (e) {
    console.error('narration proxy fetch failed:', e)
    return NextResponse.json({ ok: false, reason: 'UPSTREAM_FETCH_FAILED' }, { status: 502 })
  }

  const text = await upstream.text()
  try {
    const data = JSON.parse(text)
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'UPSTREAM_NON_JSON', detail: text.slice(0, 300) },
      { status: upstream.status },
    )
  }
}
